// Portal interaction logic
(function () {
  'use strict'

  // Card click tracking (for analytics or future use)
  document.querySelectorAll('.tool-card[href]').forEach(function (card) {
    card.addEventListener('click', function () {
      var title = this.querySelector('.card-title')?.textContent || 'unknown'
      console.log('[Portal] Navigating to tool:', title)
    })
  })

  // Keyboard shortcut: press '1' to go to the first tool
  document.addEventListener('keydown', function (e) {
    if (e.key === '1' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      var firstCard = document.querySelector('.tool-card[href]')
      if (firstCard) {
        window.location.href = firstCard.getAttribute('href')
      }
    }
  })
})()
