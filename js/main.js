/*
File: js/main.js
Description: Clean, corrected JavaScript with functional dark mode, flexible gallery, and form submission.
*/
document.addEventListener('DOMContentLoaded', () => {
    // --- 1. THEME TOGGLE (DARK/LIGHT MODE) ---
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const moonIcon = '<i class="fas fa-moon"></i>';
        const sunIcon = '<i class="fas fa-sun"></i>';

        const applyTheme = (theme) => {
            if (theme === 'dark') {
                document.body.classList.add('dark-mode');
                themeToggle.innerHTML = sunIcon;
            } else {
                document.body.classList.remove('dark-mode');
                themeToggle.innerHTML = moonIcon;
            }
        };

        const savedTheme = localStorage.getItem('theme') || 'light';
        applyTheme(savedTheme);

        themeToggle.addEventListener('click', () => {
            const newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
    }

    // --- 2. GENERIC SLIDESHOW FUNCTION ---
    function initializeSlideshow(containerId, autoplayInterval = 0) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const slideshow = container.querySelector('.slideshow');
        const prevBtn = container.querySelector('.prev');
        const nextBtn = container.querySelector('.next');
        let currentIndex = 0;
        let interval;

        const updateAndShowSlide = (index) => {
            const slides = slideshow.querySelectorAll('.slide');
            if (slides.length === 0) return;

            if (slides[currentIndex]) {
                const prevVideo = slides[currentIndex].querySelector('video');
                if (prevVideo) prevVideo.pause();
            }

            currentIndex = (index + slides.length) % slides.length;
            slideshow.style.transform = `translateX(-${currentIndex * 100}%)`;

            if (slides[currentIndex]) {
                const currentVideo = slides[currentIndex].querySelector('video');
                if (currentVideo) currentVideo.play().catch(e => console.error("Video play failed:", e));
            }
        };

        const startAutoplay = () => {
            if (autoplayInterval > 0) {
                const slides = slideshow.querySelectorAll('.slide');
                if (slides.length > 1) {
                   interval = setInterval(() => updateAndShowSlide(currentIndex + 1), autoplayInterval);
                }
            }
        };

        const resetAutoplay = () => {
            clearInterval(interval);
            startAutoplay();
        };

        if (prevBtn && nextBtn) {
            prevBtn.addEventListener('click', () => {
                updateAndShowSlide(currentIndex - 1);
                resetAutoplay();
            });
            nextBtn.addEventListener('click', () => {
                updateAndShowSlide(currentIndex + 1);
                resetAutoplay();
            });
        }
        
        updateAndShowSlide(0);
        startAutoplay();
        
        return { reset: resetAutoplay };
    }

    initializeSlideshow('gallery-container', 5000);
    const reviewSlideshowControl = initializeSlideshow('review-container', 7000);

    // --- 3. FETCH REVIEWS ---
    const fetchReviews = async () => {
        const reviewSlideshow = document.getElementById('reviewSlideshow');
        if (!reviewSlideshow) return;
        try {
            const response = await fetch('php/get_reviews.php');
            const reviews = await response.json();
            reviewSlideshow.innerHTML = '';
            if (reviews.length > 0) {
                reviews.forEach(review => {
                    const ratingStars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
                    reviewSlideshow.innerHTML += `
                        <div class="slide review-card">
                            <div class="rating">${ratingStars}</div>
                            <p class="review-text">"${review.review_text}"</p>
                            <p class="user-name">${review.user_name}</p>
                            <p class="station-name">Review for: ${review.station_name}</p>
                        </div>`;
                });
                if(reviewSlideshowControl) reviewSlideshowControl.reset();
            } else {
                reviewSlideshow.innerHTML = '<p>No reviews available yet.</p>';
            }
        } catch (error) { console.error("Error fetching reviews:", error); }
    };
    if (document.getElementById('reviewSlideshow')) {
        fetchReviews();
    }

    // --- 4. STATION SEARCH LOGIC (UPDATED FOR LOCATION) ---
    const searchBtn = document.getElementById('searchBtn');
    const locationBtn = document.getElementById('locationBtn'); // Naya button
    if (searchBtn) {
        const cityInput = document.getElementById('cityInput');
        const resultsGrid = document.getElementById('search-results-grid');
        const stationSelect = document.getElementById('station_id');

        const displayStations = (stations) => {
            resultsGrid.innerHTML = '';
            stationSelect.innerHTML = '<option value="">Select a station</option>';

            if (stations.length === 0) {
                resultsGrid.innerHTML = '<p style="grid-column: 1 / -1;">Is area mein koi station nahi mila.</p>';
                return;
            }

            stations.forEach(station => {
                const distanceInfo = station.distance !== null 
                    ? `<div class="distance"><i class="fas fa-route"></i> ${parseFloat(station.distance).toFixed(1)} km door</div>` 
                    : '';

                resultsGrid.innerHTML += `
                    <div class="station-card">
                        <h3><i class="fas fa-gas-pump"></i> ${station.name}</h3>
                        <p><strong>Pata:</strong> ${station.address}, ${station.city}</p>
                        ${distanceInfo}
                    </div>`;
                
                stationSelect.innerHTML += `<option value="${station.id}">${station.name}, ${station.city}</option>`;
            });
        };

        const fetchStations = async (params) => {
            resultsGrid.innerHTML = `<div class="spinner" style="grid-column: 1 / -1; display:block; margin: 2rem auto;"></div>`;
            const query = new URLSearchParams(params).toString();
            try {
                const response = await fetch(`php/get_stations.php?${query}`);
                const stations = await response.json();
                displayStations(stations);
            } catch (error) {
                console.error("Error fetching stations:", error);
                resultsGrid.innerHTML = `<p style="color:red; grid-column: 1 / -1;">Stations fetch nahi ho sake.</p>`;
            }
        };

        searchBtn.addEventListener('click', () => {
            const city = cityInput.value.trim();
            if (city) {
                fetchStations({ city: city });
            }
        });
        cityInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                searchBtn.click();
            }
        });

        locationBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
                resultsGrid.innerHTML = `<p style="grid-column: 1 / -1;">Aapki location get ki jaa rahi hai...</p>`;
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        fetchStations({ lat: latitude, lon: longitude });
                    },
                    (error) => {
                        console.error("Geolocation error:", error);
                        resultsGrid.innerHTML = `<p style="color:red; grid-column: 1 / -1;">Location access nahi ho saki. Kripya permission check karein.</p>`;
                    }
                );
            } else {
                resultsGrid.innerHTML = `<p style="color:red; grid-column: 1 / -1;">Aapka browser Geolocation support nahi karta.</p>`;
            }
        });

        fetchStations({ city: 'Delhi' }); // Initial load
    }
    
    // --- 5. FORM SUBMISSION LOGIC ---
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        const submitReviewBtn = document.getElementById('submitReviewBtn');
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            submitReviewBtn.classList.add('loading');
            submitReviewBtn.disabled = true;

            const responseMessageDiv = document.getElementById('form-response-message');
            responseMessageDiv.style.display = 'none';

            const formData = new FormData(reviewForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('php/submit_review.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                const result = await response.json();
                responseMessageDiv.textContent = result.message;
                responseMessageDiv.className = result.status === 'success' ? 'success' : 'error';
                responseMessageDiv.style.display = 'block';
                if (result.status === 'success') {
                    reviewForm.reset();
                    fetchReviews();
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                responseMessageDiv.textContent = 'A network error occurred.';
                responseMessageDiv.className = 'error';
                responseMessageDiv.style.display = 'block';
            } finally {
                submitReviewBtn.classList.remove('loading');
                submitReviewBtn.disabled = false;
            }
        });
    }
});
