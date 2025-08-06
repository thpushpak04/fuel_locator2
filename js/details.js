/*
File: js/details.js
Enhanced JavaScript for the station details page with comprehensive error handling
*/

document.addEventListener('DOMContentLoaded', () => {
    console.log('Station details page initialized');
    
    // --- THEME TOGGLE (DARK/LIGHT MODE) ---
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

        const savedTheme = localStorage.getItem('theme') || 'light';
        applyTheme(savedTheme);

        themeToggle.addEventListener('click', () => {
            const newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
    };

    // --- GET STATION ID FROM URL ---
    const getStationIdFromUrl = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const stationId = urlParams.get('id');
        
        if (!stationId || !stationId.match(/^\d+$/)) {
            console.error('Invalid or missing station ID in URL');
            return null;
        }
        
        return parseInt(stationId, 10);
    };

    // Get DOM elements
    const loadingContainer = document.getElementById('loading-container');
    const errorContainer = document.getElementById('error-container');
    const detailsContent = document.getElementById('station-details-content');
    const retryBtn = document.getElementById('retry-btn');
    const backBtn = document.getElementById('back-btn');

    // --- NAVIGATION HANDLERS ---
    const initializeNavigation = () => {
        // Back button functionality
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                // Try to go back in history, fallback to home page
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    window.location.href = 'index.html';
                }
            });
        }
    };

    // --- DISPLAY STATE FUNCTIONS ---
    const showLoading = () => {
        if (loadingContainer) loadingContainer.style.display = 'block';
        if (errorContainer) errorContainer.style.display = 'none';
        if (detailsContent) detailsContent.style.display = 'none';
    };

    const showError = (message) => {
        if (loadingContainer) loadingContainer.style.display = 'none';
        if (errorContainer) errorContainer.style.display = 'block';
        if (detailsContent) detailsContent.style.display = 'none';
        
        const errorMessage = document.getElementById('error-message');
        if (errorMessage) {
            errorMessage.textContent = message || 'An error occurred while loading station details.';
        }
    };

    const showDetails = () => {
        if (loadingContainer) loadingContainer.style.display = 'none';
        if (errorContainer) errorContainer.style.display = 'none';
        if (detailsContent) detailsContent.style.display = 'block';
    };

    // --- UTILITY FUNCTIONS ---
    const calculateYearsInService = (establishmentDate) => {
        if (!establishmentDate || establishmentDate === 'N/A' || establishmentDate === '0000-00-00') {
            return 'N/A';
        }
        
        try {
            let estDate;
            
            // Try to parse different date formats
            if (establishmentDate.includes('-')) {
                const parts = establishmentDate.split('-');
                if (parts.length === 3) {
                    // Check if it's dd-mm-yyyy or yyyy-mm-dd
                    if (parts[0].length === 4) {
                        // yyyy-mm-dd format
                        estDate = new Date(parts[0], parts[1] - 1, parts[2]);
                    } else {
                        // dd-mm-yyyy format
                        estDate = new Date(parts[2], parts[1] - 1, parts[0]);
                    }
                }
            }
            
            if (!estDate || isNaN(estDate.getTime())) {
                return 'N/A';
            }
            
            const currentDate = new Date();
            const years = Math.floor((currentDate - estDate) / (365.25 * 24 * 60 * 60 * 1000));
            
            return years >= 0 ? `${years} year${years !== 1 ? 's' : ''}` : 'N/A';
        } catch (error) {
            console.error('Error calculating years in service:', error);
            return 'N/A';
        }
    };

    const populateAmenities = () => {
        const amenitiesGrid = document.getElementById('amenities-grid');
        if (!amenitiesGrid) return;
        
        const commonAmenities = [
            { icon: 'fas fa-gas-pump', name: 'Fuel Pumps' },
            { icon: 'fas fa-car-wash', name: 'Car Wash' },
            { icon: 'fas fa-store', name: 'Convenience Store' },
            { icon: 'fas fa-restroom', name: 'Restrooms' },
            { icon: 'fas fa-credit-card', name: 'Card Payment' },
            { icon: 'fas fa-air-freshener', name: 'Air & Water' },
            { icon: 'fas fa-coffee', name: 'Refreshments' },
            { icon: 'fas fa-wifi', name: 'Free WiFi' }
        ];

        amenitiesGrid.innerHTML = '';
        commonAmenities.forEach(amenity => {
            const amenityElement = document.createElement('div');
            amenityElement.className = 'amenity-item';
            amenityElement.innerHTML = `
                <i class="${amenity.icon}"></i>
                <span>${amenity.name}</span>
            `;
            amenitiesGrid.appendChild(amenityElement);
        });
    };

    const updatePageTitle = (stationName) => {
        if (stationName) {
            document.title = `${stationName} - Station Details | Fuel Station Locator`;
        }
    };

    const updateActionButtons = (station) => {
        // Update "View on Map" button functionality
        const mapButton = document.querySelector('.action-btn.secondary');
        if (mapButton && station) {
            mapButton.onclick = () => {
                const address = encodeURIComponent(`${station.address}, ${station.city}`);
                const mapUrl = `https://maps.google.com?q=${address}`;
                window.open(mapUrl, '_blank');
            };
        }
    };

    // --- MAIN FETCH FUNCTION ---
    const fetchStationDetails = async (stationId) => {
        if (!stationId) {
            showError('No station ID provided in the URL.');
            return;
        }

        showLoading();
        console.log('Fetching details for station ID:', stationId);

        try {
            const response = await fetch(`php/get_station_details.php?id=${stationId}`);
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Station details response:', result);

            if (result.status === 'success' && result.data) {
                const station = result.data;
                
                // Populate basic information with safe fallbacks
                const updateElement = (id, value, fallback = 'Not available') => {
                    const element = document.getElementById(id);
                    if (element) {
                        element.textContent = value || fallback;
                    }
                };

                // Update station name
                const stationNameElement = document.querySelector('.station-name-text');
                if (stationNameElement) {
                    const stationName = station.name || 'Unknown Station';
                    stationNameElement.textContent = stationName;
                    updatePageTitle(stationName);
                }

                // Update basic details
                updateElement('station-address', station.address, 'Address not available');
                updateElement('station-city', station.city, 'City not available');
                updateElement('station-id-display', station.id, 'N/A');

                // Update operator information
                updateElement('operator-name', station.operator_name, 'Not specified');
                updateElement('company-type', station.company_type, 'Private');

                // Update establishment information
                updateElement('establishment-date', station.establishment_date_formatted, 'N/A');
                updateElement('years-service', calculateYearsInService(station.establishment_date_formatted));

                // Update contact information
                updateElement('station-phone', station.phone, 'Not available');
                updateElement('station-email', station.email, 'Not available');

                // Populate amenities
                populateAmenities();

                // Update action buttons
                updateActionButtons(station);

                // Update operating status
                const currentStatusElement = document.getElementById('current-status');
                if (currentStatusElement) {
                    const currentHour = new Date().getHours();
                    const isOpen = currentHour >= 6 && currentHour < 22; // Assume 6 AM to 10 PM
                    
                    currentStatusElement.innerHTML = isOpen 
                        ? '<i class="fas fa-circle" style="color: #28a745;"></i> Open Now'
                        : '<i class="fas fa-circle" style="color: #dc3545;"></i> Closed Now';
                    
                    currentStatusElement.className = `detail-value ${isOpen ? 'status-open' : 'status-closed'}`;
                }

                showDetails();
                console.log('Station details loaded successfully');
                
            } else {
                throw new Error(result.message || 'Station details could not be loaded.');
            }
            
        } catch (error) {
            console.error('Error fetching station details:', error);
            
            let errorMessage = 'Failed to load station details. ';
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

    // --- RETRY FUNCTIONALITY ---
    const initializeRetry = (stationId) => {
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                fetchStationDetails(stationId);
            });
        }
    };

    // --- INITIALIZE ALL COMPONENTS ---
    const initialize = () => {
        try {
            // Initialize theme toggle
            initializeThemeToggle();
            
            // Initialize navigation
            initializeNavigation();
            
            // Get station ID from URL
            const stationId = getStationIdFromUrl();
            
            if (!stationId) {
                showError('Invalid station ID. Please go back and select a station.');
                return;
            }
            
            // Initialize retry functionality
            initializeRetry(stationId);
            
            // Fetch station details
            fetchStationDetails(stationId);
            
            console.log('Details page components initialized successfully');
            
        } catch (error) {
            console.error('Error during initialization:', error);
            showError('Failed to initialize page. Please refresh and try again.');
        }
    };

    // Start initialization
    initialize();
});