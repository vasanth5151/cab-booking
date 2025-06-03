// Global variables
let map
let directionsService
let directionsRenderer
let pickupMarker
let dropoffMarker
let autocompletePickup
let autocompleteDropoff
let selectedCarType = "economy"
let selectedCarPrice = 1.5
let currentRoute = null
let isGoogleMapsLoaded = false

// DOM Elements
const bookingForm = document.getElementById("bookingForm")
const contactForm = document.getElementById("contactForm")
const carOptions = document.querySelectorAll(".car-option")
const pickupInput = document.getElementById("pickup")
const dropoffInput = document.getElementById("dropoff")
const dateInput = document.getElementById("date")
const timeInput = document.getElementById("time")
const distanceSpan = document.getElementById("distance")
const durationSpan = document.getElementById("duration")
const baseFareSpan = document.getElementById("baseFare")
const priceSpan = document.getElementById("price")
const modal = document.getElementById("confirmationModal")
const apiKeyModal = document.getElementById("apiKeyModal")
const closeBtn = document.querySelector(".close")
const navToggle = document.querySelector(".nav-toggle")
const navMenu = document.querySelector(".nav-menu")
const showRouteBtn = document.getElementById("showRoute")
const clearRouteBtn = document.getElementById("clearRoute")

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  initializeDateInput()
  initializeTimeInput()
  setupEventListeners()
  selectDefaultCar()

  // Show API key modal if Google Maps is not available
  setTimeout(() => {
    if (!isGoogleMapsLoaded) {
      showApiKeyModal()
    }
  }, 3000)
})

// Google Maps initialization callback
window.initMap = () => {
  isGoogleMapsLoaded = true

  // Initialize map centered on a default location (New York City)
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 13,
    center: { lat: 40.7128, lng: -74.006 },
    styles: [
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }],
      },
    ],
  })

  // Initialize directions service and renderer
  directionsService = new google.maps.DirectionsService()
  directionsRenderer = new google.maps.DirectionsRenderer({
    draggable: false,
    suppressMarkers: false,
  })
  directionsRenderer.setMap(map)

  // Initialize autocomplete for pickup and dropoff
  setupAutocompleteGoogle()

  // Try to get user's current location
  getCurrentLocation()
}

// Setup Google Places Autocomplete
function setupAutocompleteGoogle() {
  if (!google || !google.maps || !google.maps.places) {
    console.warn("Google Places API not available")
    return
  }

  // Setup pickup autocomplete
  autocompletePickup = new google.maps.places.Autocomplete(pickupInput, {
    types: ["establishment", "geocode"],
    componentRestrictions: { country: "us" },
  })

  autocompletePickup.addListener("place_changed", () => {
    const place = autocompletePickup.getPlace()
    if (place.geometry) {
      handlePickupSelection(place)
    }
  })

  // Setup dropoff autocomplete
  autocompleteDropoff = new google.maps.places.Autocomplete(dropoffInput, {
    types: ["establishment", "geocode"],
    componentRestrictions: { country: "us" },
  })

  autocompleteDropoff.addListener("place_changed", () => {
    const place = autocompleteDropoff.getPlace()
    if (place.geometry) {
      handleDropoffSelection(place)
    }
  })
}

// Get user's current location
function getCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }

        map.setCenter(userLocation)

        // Reverse geocode to get address
        const geocoder = new google.maps.Geocoder()
        geocoder.geocode({ location: userLocation }, (results, status) => {
          if (status === "OK" && results[0]) {
            pickupInput.value = results[0].formatted_address
          }
        })
      },
      (error) => {
        console.warn("Geolocation error:", error)
      },
    )
  }
}

// Handle pickup location selection
function handlePickupSelection(place) {
  if (pickupMarker) {
    pickupMarker.setMap(null)
  }

  pickupMarker = new google.maps.Marker({
    position: place.geometry.location,
    map: map,
    title: "Pickup Location",
    icon: {
      url:
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#28a745">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
            `),
      scaledSize: new google.maps.Size(32, 32),
    },
  })

  calculateRoute()
}

// Handle dropoff location selection
function handleDropoffSelection(place) {
  if (dropoffMarker) {
    dropoffMarker.setMap(null)
  }

  dropoffMarker = new google.maps.Marker({
    position: place.geometry.location,
    map: map,
    title: "Drop-off Location",
    icon: {
      url:
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#dc3545">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
            `),
      scaledSize: new google.maps.Size(32, 32),
    },
  })

  calculateRoute()
}

// Calculate route between pickup and dropoff
function calculateRoute() {
  if (!pickupMarker || !dropoffMarker || !directionsService) {
    return
  }

  const request = {
    origin: pickupMarker.getPosition(),
    destination: dropoffMarker.getPosition(),
    travelMode: google.maps.TravelMode.DRIVING,
    unitSystem: google.maps.UnitSystem.METRIC,
    avoidHighways: false,
    avoidTolls: false,
  }

  directionsService.route(request, (result, status) => {
    if (status === "OK") {
      currentRoute = result
      updateRouteInfo(result)
    } else {
      console.error("Directions request failed:", status)
      showAlert("Could not calculate route. Please check your locations.", "error")
    }
  })
}

// Update route information
function updateRouteInfo(result) {
  const route = result.routes[0]
  const leg = route.legs[0]

  const distance = (leg.distance.value / 1000).toFixed(1) // Convert to km
  const duration = Math.round(leg.duration.value / 60) // Convert to minutes

  distanceSpan.textContent = `${distance} km`
  durationSpan.textContent = `${duration} min`

  calculatePrice(Number.parseFloat(distance))

  // Add animation effect
  distanceSpan.style.color = "#28a745"
  durationSpan.style.color = "#28a745"

  setTimeout(() => {
    distanceSpan.style.color = "#2c5aa0"
    durationSpan.style.color = "#2c5aa0"
  }, 1000)
}

// Calculate price based on distance and car type
function calculatePrice(distance) {
  const baseFare = 5.0
  const distanceFare = distance * selectedCarPrice
  const totalPrice = baseFare + distanceFare

  baseFareSpan.textContent = `$${baseFare.toFixed(2)}`
  priceSpan.textContent = `$${totalPrice.toFixed(2)}`
}

// Show route on map
function showRoute() {
  if (currentRoute && directionsRenderer) {
    directionsRenderer.setDirections(currentRoute)

    // Hide individual markers when showing route
    if (pickupMarker) pickupMarker.setVisible(false)
    if (dropoffMarker) dropoffMarker.setVisible(false)

    showAlert("Route displayed on map", "success")
  } else {
    showAlert("Please select pickup and drop-off locations first", "warning")
  }
}

// Clear route from map
function clearRoute() {
  if (directionsRenderer) {
    directionsRenderer.setDirections({ routes: [] })

    // Show individual markers again
    if (pickupMarker) pickupMarker.setVisible(true)
    if (dropoffMarker) dropoffMarker.setVisible(true)

    showAlert("Route cleared from map", "info")
  }
}

// Fallback functions for when Google Maps is not available
function simulateLocationSearch(input, suggestionsContainer) {
  const sampleLocations = [
    { main: "Times Square", secondary: "Manhattan, NY, USA" },
    { main: "Central Park", secondary: "New York, NY, USA" },
    { main: "Brooklyn Bridge", secondary: "New York, NY, USA" },
    { main: "Statue of Liberty", secondary: "New York, NY, USA" },
    { main: "Empire State Building", secondary: "Manhattan, NY, USA" },
    { main: "JFK Airport", secondary: "Queens, NY, USA" },
    { main: "LaGuardia Airport", secondary: "Queens, NY, USA" },
    { main: "Grand Central Terminal", secondary: "Manhattan, NY, USA" },
  ]

  input.addEventListener("input", function () {
    const value = this.value.toLowerCase()
    suggestionsContainer.innerHTML = ""

    if (value.length < 2) {
      suggestionsContainer.classList.remove("show")
      return
    }

    const matches = sampleLocations.filter(
      (location) => location.main.toLowerCase().includes(value) || location.secondary.toLowerCase().includes(value),
    )

    if (matches.length > 0) {
      matches.forEach((location) => {
        const item = document.createElement("div")
        item.className = "suggestion-item"
        item.innerHTML = `
                    <div class="suggestion-main">${location.main}</div>
                    <div class="suggestion-secondary">${location.secondary}</div>
                `

        item.addEventListener("click", () => {
          input.value = location.main + ", " + location.secondary
          suggestionsContainer.classList.remove("show")
          simulateRouteCalculation()
        })

        suggestionsContainer.appendChild(item)
      })

      suggestionsContainer.classList.add("show")
    } else {
      suggestionsContainer.classList.remove("show")
    }
  })

  // Hide suggestions when clicking outside
  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !suggestionsContainer.contains(e.target)) {
      suggestionsContainer.classList.remove("show")
    }
  })
}

// Simulate route calculation for demo
function simulateRouteCalculation() {
  const pickup = pickupInput.value.trim()
  const dropoff = dropoffInput.value.trim()

  if (pickup && dropoff) {
    // Simulate distance and duration
    const distance = (Math.random() * 20 + 5).toFixed(1) // 5-25 km
    const duration = Math.round(distance * 2.5 + Math.random() * 10) // Approximate duration

    distanceSpan.textContent = `${distance} km`
    durationSpan.textContent = `${duration} min`

    calculatePrice(Number.parseFloat(distance))

    // Add animation effect
    distanceSpan.style.color = "#28a745"
    durationSpan.style.color = "#28a745"

    setTimeout(() => {
      distanceSpan.style.color = "#2c5aa0"
      durationSpan.style.color = "#2c5aa0"
    }, 1000)
  }
}

// Set minimum date to today
function initializeDateInput() {
  const today = new Date().toISOString().split("T")[0]
  dateInput.setAttribute("min", today)
  dateInput.value = today
}

// Set default time to current time + 1 hour
function initializeTimeInput() {
  const now = new Date()
  now.setHours(now.getHours() + 1)
  const timeString = now.toTimeString().slice(0, 5)
  timeInput.value = timeString
}

// Setup all event listeners
function setupEventListeners() {
  // Car selection
  carOptions.forEach((option) => {
    option.addEventListener("click", function () {
      selectCar(this)
    })
  })

  // Form submissions
  bookingForm.addEventListener("submit", handleBookingSubmit)
  contactForm.addEventListener("submit", handleContactSubmit)

  // Modal controls
  closeBtn.addEventListener("click", closeModal)
  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal()
    }
  })

  // Mobile navigation
  navToggle.addEventListener("click", toggleMobileNav)

  // Map controls
  showRouteBtn.addEventListener("click", showRoute)
  clearRouteBtn.addEventListener("click", clearRoute)

  // Smooth scrolling for navigation links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()
      const target = document.querySelector(this.getAttribute("href"))
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    })
  })

  // Setup fallback autocomplete if Google Maps is not available
  setTimeout(() => {
    if (!isGoogleMapsLoaded) {
      const pickupSuggestions = document.getElementById("pickupSuggestions")
      const dropoffSuggestions = document.getElementById("dropoffSuggestions")

      simulateLocationSearch(pickupInput, pickupSuggestions)
      simulateLocationSearch(dropoffInput, dropoffSuggestions)

      // Add input listeners for price calculation
      pickupInput.addEventListener("input", simulateRouteCalculation)
      dropoffInput.addEventListener("input", simulateRouteCalculation)
    }
  }, 3000)
}

// Select default car (Economy)
function selectDefaultCar() {
  const defaultCar = document.querySelector('.car-option[data-type="economy"]')
  if (defaultCar) {
    selectCar(defaultCar)
  }
}

// Handle car selection
function selectCar(selectedOption) {
  // Remove selection from all options
  carOptions.forEach((option) => {
    option.classList.remove("selected")
  })

  // Add selection to clicked option
  selectedOption.classList.add("selected")

  // Update selected car data
  selectedCarType = selectedOption.dataset.type
  selectedCarPrice = Number.parseFloat(selectedOption.dataset.price)

  // Recalculate price if distance is available
  const currentDistance = distanceSpan.textContent
  if (currentDistance !== "-- km") {
    const distance = Number.parseFloat(currentDistance.replace(" km", ""))
    calculatePrice(distance)
  }
}

// Handle booking form submission
function handleBookingSubmit(e) {
  e.preventDefault()

  // Validate form
  if (!validateBookingForm()) {
    return
  }

  // Get form data
  const formData = {
    pickup: pickupInput.value,
    dropoff: dropoffInput.value,
    date: dateInput.value,
    time: timeInput.value,
    carType: selectedCarType,
    distance: distanceSpan.textContent,
    duration: durationSpan.textContent,
    price: priceSpan.textContent,
  }

  // Show loading state
  const submitBtn = bookingForm.querySelector(".book-btn")
  const originalText = submitBtn.innerHTML
  submitBtn.innerHTML = '<div class="spinner"></div> Processing...'
  submitBtn.disabled = true

  // Simulate API call
  setTimeout(() => {
    // Reset button
    submitBtn.innerHTML = originalText
    submitBtn.disabled = false

    // Show confirmation modal
    showBookingConfirmation(formData)
  }, 2000)
}

// Validate booking form
function validateBookingForm() {
  const pickup = pickupInput.value.trim()
  const dropoff = dropoffInput.value.trim()
  const date = dateInput.value
  const time = timeInput.value

  if (!pickup) {
    showAlert("Please enter pickup location", "error")
    pickupInput.focus()
    return false
  }

  if (!dropoff) {
    showAlert("Please enter drop-off location", "error")
    dropoffInput.focus()
    return false
  }

  if (!date) {
    showAlert("Please select date", "error")
    dateInput.focus()
    return false
  }

  if (!time) {
    showAlert("Please select time", "error")
    timeInput.focus()
    return false
  }

  // Check if date/time is in the future
  const selectedDateTime = new Date(`${date}T${time}`)
  const now = new Date()

  if (selectedDateTime <= now) {
    showAlert("Please select a future date and time", "error")
    return false
  }

  // Check if route has been calculated
  if (distanceSpan.textContent === "-- km") {
    showAlert("Please wait for route calculation to complete", "warning")
    return false
  }

  return true
}

// Show booking confirmation modal
function showBookingConfirmation(data) {
  // Generate booking ID
  const bookingId = "RE" + Date.now().toString().slice(-6)

  // Populate modal with booking details
  document.getElementById("bookingId").textContent = bookingId
  document.getElementById("modalPickup").textContent = data.pickup
  document.getElementById("modalDropoff").textContent = data.dropoff
  document.getElementById("modalDateTime").textContent = formatDateTime(data.date, data.time)
  document.getElementById("modalCarType").textContent = capitalizeFirst(data.carType)
  document.getElementById("modalDistance").textContent = data.distance
  document.getElementById("modalDuration").textContent = data.duration
  document.getElementById("modalPrice").textContent = data.price

  // Show modal
  modal.style.display = "block"
  document.body.style.overflow = "hidden"

  // Store booking data for tracking
  localStorage.setItem(
    "currentBooking",
    JSON.stringify({
      ...data,
      bookingId: bookingId,
      status: "confirmed",
    }),
  )
}

// Close modal
function closeModal() {
  modal.style.display = "none"
  document.body.style.overflow = "auto"

  // Reset form
  bookingForm.reset()
  initializeDateInput()
  initializeTimeInput()
  selectDefaultCar()

  // Clear route and markers
  if (directionsRenderer) {
    directionsRenderer.setDirections({ routes: [] })
  }
  if (pickupMarker) {
    pickupMarker.setMap(null)
    pickupMarker = null
  }
  if (dropoffMarker) {
    dropoffMarker.setMap(null)
    dropoffMarker = null
  }

  // Reset price display
  distanceSpan.textContent = "-- km"
  durationSpan.textContent = "-- min"
  priceSpan.textContent = "$--"
}

// Show API key modal
function showApiKeyModal() {
  apiKeyModal.style.display = "block"
  document.body.style.overflow = "hidden"
}

// Close API key modal
function closeApiKeyModal() {
  apiKeyModal.style.display = "none"
  document.body.style.overflow = "auto"
}

// Track ride function
function trackRide() {
  showAlert("Tracking feature will be available in the mobile app!", "info")
  closeModal()
}

// Handle contact form submission
function handleContactSubmit(e) {
  e.preventDefault()

  const submitBtn = contactForm.querySelector("button")
  const originalText = submitBtn.textContent

  // Show loading state
  submitBtn.textContent = "Sending..."
  submitBtn.disabled = true

  // Simulate API call
  setTimeout(() => {
    // Reset button
    submitBtn.textContent = originalText
    submitBtn.disabled = false

    // Show success message
    showAlert("Thank you for your message! We'll get back to you soon.", "success")

    // Reset form
    contactForm.reset()
  }, 1500)
}

// Toggle mobile navigation
function toggleMobileNav() {
  navMenu.classList.toggle("active")
  navToggle.classList.toggle("active")
}

// Utility functions
function formatDateTime(date, time) {
  const dateObj = new Date(`${date}T${time}`)
  return dateObj.toLocaleString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function showAlert(message, type = "info") {
  // Create alert element
  const alert = document.createElement("div")
  alert.className = `alert alert-${type}`
  alert.innerHTML = `
        <i class="fas fa-${getAlertIcon(type)}"></i>
        <span>${message}</span>
        <button class="alert-close">&times;</button>
    `

  // Style the alert
  Object.assign(alert.style, {
    position: "fixed",
    top: "100px",
    right: "20px",
    background: getAlertColor(type),
    color: "white",
    padding: "1rem 1.5rem",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    zIndex: "9999",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    minWidth: "300px",
    animation: "slideInRight 0.3s ease",
  })

  // Add close functionality
  const closeBtn = alert.querySelector(".alert-close")
  closeBtn.style.background = "none"
  closeBtn.style.border = "none"
  closeBtn.style.color = "white"
  closeBtn.style.fontSize = "1.2rem"
  closeBtn.style.cursor = "pointer"
  closeBtn.style.marginLeft = "auto"

  closeBtn.addEventListener("click", () => {
    alert.remove()
  })

  // Add to page
  document.body.appendChild(alert)

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (alert.parentNode) {
      alert.remove()
    }
  }, 5000)
}

function getAlertIcon(type) {
  const icons = {
    success: "check-circle",
    error: "exclamation-circle",
    warning: "exclamation-triangle",
    info: "info-circle",
  }
  return icons[type] || "info-circle"
}

function getAlertColor(type) {
  const colors = {
    success: "#28a745",
    error: "#dc3545",
    warning: "#ffc107",
    info: "#17a2b8",
  }
  return colors[type] || "#17a2b8"
}

// Add CSS for alert animation
const style = document.createElement("style")
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .nav-menu.active {
        display: flex;
        position: absolute;
        top: 100%;
        left: 0;
        width: 100%;
        background: white;
        flex-direction: column;
        padding: 1rem;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .nav-toggle.active span:nth-child(1) {
        transform: rotate(-45deg) translate(-5px, 6px);
    }
    
    .nav-toggle.active span:nth-child(2) {
        opacity: 0;
    }
    
    .nav-toggle.active span:nth-child(3) {
        transform: rotate(45deg) translate(-5px, -6px);
    }
    
    @media (max-width: 768px) {
        .nav-menu {
            display: none;
        }
    }
`
document.head.appendChild(style)

// Add some sample locations for autocomplete (in real app, you'd use Google Places API)
const sampleLocations = [
  "Downtown Plaza",
  "Airport Terminal",
  "Central Station",
  "Shopping Mall",
  "Business District",
  "University Campus",
  "Hospital",
  "Hotel Grand",
  "City Park",
  "Sports Stadium",
]

// Simple autocomplete functionality
function setupAutocompleteFallback(input) {
  input.addEventListener("input", function () {
    const value = this.value.toLowerCase()
    if (value.length < 2) return

    const matches = sampleLocations.filter((location) => location.toLowerCase().includes(value))

    // In a real app, you'd show these in a dropdown
    console.log("Suggested locations:", matches)
  })
}

// Initialize autocomplete for location inputs
setupAutocompleteFallback(pickupInput)
setupAutocompleteFallback(dropoffInput)
