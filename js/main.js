/*hello thats my js*/

document.addEventListener('DOMContentLoaded', () => {
    console.log('Fuel Station Locator initialized');
    
    // --- 1. THEME TOGGLE (DARK/LIGHT MODE) ---
    const initializeThemeToggle = () => {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;
        
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

        // Load saved theme or default to light
        const savedTheme = localStorage.getItem('theme') || 'light';
        applyTheme(savedTheme);

        themeToggle.addEventListener('click', () => {
            const newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
    };

    // --- 2. GENERIC SLIDESHOW FUNCTION ---
    function initializeSlideshow(containerId, autoplayInterval = 0) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.log(`Slideshow container ${containerId} not found`);
            return null;
        }

        const slideshow = container.querySelector('.slideshow');
        const prevBtn = container.querySelector('.prev');
        const nextBtn = container.querySelector('.next');
        
        if (!slideshow) {
            console.log(`Slideshow element not found in ${containerId}`);
            return null;
        }
        
        let currentIndex = 0;
        let interval;

        const updateAndShowSlide = (index) => {
            const slides = slideshow.querySelectorAll('.slide');
            if (slides.length === 0) {
                console.log('No slides found');
                return;
            }

            // Pause previous video if exists
            if (slides[currentIndex]) {
                const prevVideo = slides[currentIndex].querySelector('video');
                if (prevVideo) prevVideo.pause();
            }

            currentIndex = (index + slides.length) % slides.length;
            slideshow.style.transform = `translateX(-${currentIndex * 100}%)`;

            // Play current video if exists
            if (slides[currentIndex]) {
                const currentVideo = slides[currentIndex].querySelector('video');
                if (currentVideo) {
                    currentVideo.play().catch(e => console.error("Video play failed:", e));
                }
            }
        };

        const startAutoplay = () => {
            if (autoplayInterval > 0) {
                const slides = slideshow.querySelectorAll('.slide');
                if (slides.length > 1) {
                    interval = setInterval(() => {
                        updateAndShowSlide(currentIndex + 1);
                    }, autoplayInterval);
                }
            }
        };

        const resetAutoplay = () => {
            clearInterval(interval);
            startAutoplay();
        };

        // Add event listeners for navigation buttons
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
        
        // Initialize slideshow
        updateAndShowSlide(0);
        startAutoplay();
        
        return { 
            reset: resetAutoplay,
            updateSlide: updateAndShowSlide,
            getCurrentIndex: () => currentIndex
        };
    }

    // --- 3. FETCH REVIEWS WITH ERROR HANDLING ---
    const fetchReviews = async () => {
        const reviewSlideshow = document.getElementById('reviewSlideshow');
        if (!reviewSlideshow) {
            console.log('Review slideshow element not found');
            return;
        }

        try {
            console.log('Fetching reviews...');
            const response = await fetch('php/get_reviews.php');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Handle error response from PHP
            if (data.error) {
                throw new Error(data.message || 'Failed to fetch reviews');
            }
            
            const reviews = Array.isArray(data) ? data : [];
            reviewSlideshow.innerHTML = '';
            
            if (reviews.length > 0) {
                reviews.forEach(review => {
                    const ratingStars = '★'.repeat(Math.max(0, Math.min(5, review.rating))) + 
                                      '☆'.repeat(5 - Math.max(0, Math.min(5, review.rating)));
                    
                    const reviewCard = document.createElement('div');
                    reviewCard.className = 'slide review-card';
                    reviewCard.innerHTML = `
                        <div class="rating">${ratingStars}</div>
                        <p class="review-text">"${review.review_text}"</p>
                        <p class="user-name">${review.user_name}</p>
                        <p class="station-name">Review for: ${review.station_name}</p>
                    `;
                    reviewSlideshow.appendChild(reviewCard);
                });
                
                console.log(`Loaded ${reviews.length} reviews`);
                
                // Reset slideshow after adding new content
                if (window.reviewSlideshowControl) {
                    window.reviewSlideshowControl.reset();
                }
            } else {
                reviewSlideshow.innerHTML = '<div class="slide review-card"><p>No reviews available yet. Be the first to review!</p></div>';
            }
            
        } catch (error) {
            console.error("Error fetching reviews:", error);
            reviewSlideshow.innerHTML = '<div class="slide review-card"><p>Unable to load reviews at the moment.</p></div>';
        }
    };

    // --- 4. STATION SEARCH LOGIC WITH ENHANCED ERROR HANDLING ---
    const initializeStationSearch = () => {
        const searchBtn = document.getElementById('searchBtn');
        const locationBtn = document.getElementById('locationBtn');
        const cityInput = document.getElementById('cityInput');
        const resultsGrid = document.getElementById('search-results-grid');
        const stationSelect = document.getElementById('station_id');

        if (!searchBtn || !cityInput || !resultsGrid) {
            console.log('Search elements not found');
            return;
        }

        // Function to show loading state
        const showLoading = (message = 'Searching for stations...') => {
            resultsGrid.innerHTML = `
                <div class="loading-state" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                    <div class="spinner" style="margin: 0 auto 1rem;"></div>
                    <p>${message}</p>
                </div>
            `;
        };

        // Function to show error message
        const showError = (message) => {
            resultsGrid.innerHTML = `
                <div class="error-state" style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #e74c3c;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>${message}</p>
                    <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Try Again
                    </button>
                </div>
            `;
        };

        // Function to display station cards as clickable links
        const displayStations = (stations) => {
            resultsGrid.innerHTML = '';
            
            // Update station select dropdown
            if (stationSelect) {
                stationSelect.innerHTML = '<option value="">Select a station to review</option>';
            }

            if (!Array.isArray(stations) || stations.length === 0) {
                resultsGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                        <i class="fas fa-search" style="font-size: 2rem; color: #bdc3c7; margin-bottom: 1rem;"></i>
                        <p>No fuel stations found in this area.</p>
                        <p style="color: #7f8c8d; font-size: 0.9rem;">Try searching for a different city or use your location.</p>
                    </div>
                `;
                return;
            }

            console.log(`Displaying ${stations.length} stations`);
            
            stations.forEach(station => {
                // Create distance display
                const distanceInfo = station.distance !== null && station.distance !== undefined
                    ? `<div class="distance"><i class="fas fa-route"></i> ${parseFloat(station.distance).toFixed(1)} km away</div>` 
                    : '';

                // Create clickable station card
                const cardElement = document.createElement('a');
                cardElement.href = `details.html?id=${station.id}`;
                cardElement.className = 'station-card-link';
                cardElement.innerHTML = `
                    <div class="station-card">
                        <h3><i class="fas fa-gas-pump"></i> ${station.name}</h3>
                        <p><i class="fas fa-map-marker-alt"></i> ${station.address}, ${station.city}</p>
                        ${distanceInfo}
                        <div class="station-meta" style="margin-top: 10px; font-size: 0.9rem; color: #7f8c8d;">
                            <span><i class="fas fa-building"></i> ${station.operator_name || 'Unknown Operator'}</span>
                        </div>
                    </div>
                `;
                
                resultsGrid.appendChild(cardElement);
            
                // Add to station select dropdown
                if (stationSelect) {
                    const option = document.createElement('option');
                    option.value = station.id;
                    option.textContent = `${station.name}, ${station.city}`;
                    stationSelect.appendChild(option);
                }
            });
        };

        // Function to fetch stations with comprehensive error handling
        const fetchStations = async (params) => {
            const query = new URLSearchParams(params).toString();
            showLoading();
            
            try {
                console.log('Fetching stations with params:', params);
                
                const response = await fetch(`php/get_stations.php?${query}`);
                
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status} ${response.statusText}`);
                }
                
                const data = await response.json();
                
                // Handle error response from PHP
                if (data.error) {
                    throw new Error(data.message || 'Failed to fetch stations');
                }
                
                if (!Array.isArray(data)) {
                    throw new Error('Invalid response format from server');
                }
                
                displayStations(data);
                
            } catch (error) {
                console.error("Error fetching stations:", error);
                
                let errorMessage = 'Failed to load fuel stations. ';
                if (error.message.includes('Failed to fetch')) {
                    errorMessage += 'Please check your internet connection.';
                } else if (error.message.includes('Server error')) {
                    errorMessage += 'Server is temporarily unavailable.';
                } else {
                    errorMessage += error.message;
                }
                
                showError(errorMessage);
            }
        };

        // Search button event listener
        searchBtn.addEventListener('click', () => {
            const city = cityInput.value.trim();
            if (city) {
                fetchStations({ city: city });
            } else {
                showError('Please enter a city name to search.');
            }
        });

        // Enter key support for search input
        cityInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                searchBtn.click();
            }
        });

        // Location button event listener
        if (locationBtn) {
            locationBtn.addEventListener('click', () => {
                if (!navigator.geolocation) {
                    showError('Geolocation is not supported by your browser.');
                    return;
                }
                
                showLoading('Getting your location...');
                
                const options = {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                };
                
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        console.log('Location obtained:', latitude, longitude);
                        fetchStations({ lat: latitude, lon: longitude });
                    },
                    (error) => {
                        console.error("Geolocation error:", error);
                        
                        let errorMessage = 'Could not access your location. ';
                        switch(error.code) {
                            case error.PERMISSION_DENIED:
                                errorMessage += 'Please allow location access and try again.';
                                break;
                            case error.POSITION_UNAVAILABLE:
                                errorMessage += 'Location information is unavailable.';
                                break;
                            case error.TIMEOUT:
                                errorMessage += 'Location request timed out.';
                                break;
                            default:
                                errorMessage += 'An unknown error occurred.';
                                break;
                        }
                        
                        showError(errorMessage);
                    },
                    options
                );
            });
        }

        // Initial load with default city
        fetchStations({ city: 'Delhi' });
    };
    
    // --- 5. FORM SUBMISSION LOGIC WITH VALIDATION ---
    const initializeReviewForm = () => {
        const reviewForm = document.getElementById('reviewForm');
        if (!reviewForm) {
            console.log('Review form not found');
            return;
        }
        
        const submitReviewBtn = document.getElementById('submitReviewBtn');
        const responseMessageDiv = document.getElementById('form-response-message');
        
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!submitReviewBtn || !responseMessageDiv) {
                console.error('Form elements not found');
                return;
            }
            
            // Show loading state
            submitReviewBtn.classList.add('loading');
            submitReviewBtn.disabled = true;
            responseMessageDiv.style.display = 'none';

            try {
                // Get form data
                const formData = new FormData(reviewForm);
                const data = Object.fromEntries(formData.entries());
                
                // Client-side validation
                if (!data.station_id || !data.name || !data.email || !data.rating || !data.review_text) {
                    throw new Error('Please fill in all required fields.');
                }
                
                if (data.name.length < 2) {
                    throw new Error('Name must be at least 2 characters long.');
                }
                
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(data.email)) {
                    throw new Error('Please enter a valid email address.');
                }
                
                if (data.review_text.length < 10) {
                    throw new Error('Review must be at least 10 characters long.');
                }
                
                console.log('Submitting review:', data);
                
                const response = await fetch('php/submit_review.php', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(data),
                });
                
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
                
                const result = await response.json();
                
                responseMessageDiv.textContent = result.message || 'Review submitted successfully!';
                responseMessageDiv.className = result.status === 'success' ? 'success' : 'error';
                responseMessageDiv.style.display = 'block';
                
                if (result.status === 'success') {
                    reviewForm.reset();
                    // Refresh reviews after successful submission
                    setTimeout(fetchReviews, 1000);
                }
                
            } catch (error) {
                console.error('Error submitting review:', error);
                responseMessageDiv.textContent = error.message || 'A network error occurred. Please try again.';
                responseMessageDiv.className = 'error';
                responseMessageDiv.style.display = 'block';
            } finally {
                submitReviewBtn.classList.remove('loading');
                submitReviewBtn.disabled = false;
            }
        });
    };

    // --- INITIALIZE ALL COMPONENTS ---
    try {
        initializeThemeToggle();
        
        // Initialize slideshows
        initializeSlideshow('gallery-container', 5000);
        window.reviewSlideshowControl = initializeSlideshow('review-container', 7000);
        
        // Fetch reviews if review slideshow exists
        if (document.getElementById('reviewSlideshow')) {
            fetchReviews();
        }
        
        // Initialize station search
        initializeStationSearch();
        
        // Initialize review form
        initializeReviewForm();
        
        console.log('All components initialized successfully');
        
    } catch (error) {
        console.error('Error during initialization:', error);
    }
});