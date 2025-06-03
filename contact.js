// Contact page specific functionality
document.addEventListener("DOMContentLoaded", () => {
  const contactForm = document.getElementById("contactForm")
  const chatBtn = document.querySelector(".chat-btn")

  // Declare showAlert (assuming it's defined elsewhere, e.g., in a shared script)
  window.showAlert =
    window.showAlert ||
    ((message, type) => {
      // Basic alert implementation as a fallback
      alert(message)
    })

  // Handle contact form submission
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const submitBtn = contactForm.querySelector(".submit-btn")
      const originalText = submitBtn.innerHTML

      // Show loading state
      submitBtn.innerHTML = '<div class="spinner"></div> Sending...'
      submitBtn.disabled = true

      // Simulate API call
      setTimeout(() => {
        // Reset button
        submitBtn.innerHTML = originalText
        submitBtn.disabled = false

        // Show success message
        showAlert("Thank you for your message! We'll get back to you within 2 hours.", "success")

        // Reset form
        contactForm.reset()
      }, 2000)
    })
  }

  // Handle chat button
  if (chatBtn) {
    chatBtn.addEventListener("click", () => {
      showAlert("Live chat feature coming soon! Please call us or send an email for immediate assistance.", "info")
    })
  }

  // Initialize contact map if Google Maps is available
  if (typeof google !== "undefined" && google.maps) {
    initContactMap()
  } else {
    // Fallback for when Google Maps is not available
    const mapContainer = document.getElementById("contactMap")
    if (mapContainer) {
      mapContainer.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f8f9fa; color: #666;">
                    <div style="text-align: center;">
                        <i class="fas fa-map-marker-alt" style="font-size: 3rem; margin-bottom: 1rem; color: #2c5aa0;"></i>
                        <h3>Visit Our Office</h3>
                        <p>123 Transportation Blvd, Suite 500<br>New York, NY 10001</p>
                        <p style="margin-top: 1rem;"><strong>Office Hours:</strong> Mon-Fri: 9AM-6PM</p>
                    </div>
                </div>
            `
    }
  }

  // Form validation
  const inputs = contactForm.querySelectorAll("input, select, textarea")
  inputs.forEach((input) => {
    input.addEventListener("blur", function () {
      validateField(this)
    })
  })
})

function initContactMap() {
  const mapOptions = {
    zoom: 15,
    center: { lat: 40.7505, lng: -73.9934 }, // NYC coordinates
    styles: [
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }],
      },
    ],
  }

  const map = new google.maps.Map(document.getElementById("contactMap"), mapOptions)

  // Add marker for office location
  const marker = new google.maps.Marker({
    position: { lat: 40.7505, lng: -73.9934 },
    map: map,
    title: "RideEasy Headquarters",
    icon: {
      url:
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#2c5aa0">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
            `),
      scaledSize: new google.maps.Size(40, 40),
    },
  })

  // Add info window
  const infoWindow = new google.maps.InfoWindow({
    content: `
            <div style="padding: 10px; text-align: center;">
                <h3 style="margin: 0 0 10px 0; color: #2c5aa0;">RideEasy Headquarters</h3>
                <p style="margin: 0; color: #666;">123 Transportation Blvd, Suite 500<br>New York, NY 10001</p>
                <p style="margin: 10px 0 0 0; color: #666;"><strong>Hours:</strong> Mon-Fri: 9AM-6PM</p>
            </div>
        `,
  })

  marker.addListener("click", () => {
    infoWindow.open(map, marker)
  })
}

function validateField(field) {
  const value = field.value.trim()
  const fieldName = field.name

  // Remove existing error styling
  field.style.borderColor = "#e1e5e9"

  // Validation rules
  if (field.hasAttribute("required") && !value) {
    showFieldError(field, "This field is required")
    return false
  }

  if (fieldName === "email" && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      showFieldError(field, "Please enter a valid email address")
      return false
    }
  }

  if (fieldName === "phone" && value) {
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
    if (!phoneRegex.test(value.replace(/[\s\-$$$$]/g, ""))) {
      showFieldError(field, "Please enter a valid phone number")
      return false
    }
  }

  return true
}

function showFieldError(field, message) {
  field.style.borderColor = "#dc3545"

  // Remove existing error message
  const existingError = field.parentNode.querySelector(".field-error")
  if (existingError) {
    existingError.remove()
  }

  // Add error message
  const errorDiv = document.createElement("div")
  errorDiv.className = "field-error"
  errorDiv.style.color = "#dc3545"
  errorDiv.style.fontSize = "0.8rem"
  errorDiv.style.marginTop = "0.25rem"
  errorDiv.textContent = message

  field.parentNode.appendChild(errorDiv)
}

// Add CSS for spinner animation
const style = document.createElement("style")
style.textContent = `
    .spinner {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 1s ease-in-out infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
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
`
document.head.appendChild(style)
