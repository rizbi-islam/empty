// Hamburger Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
  const hamburgerMenu = document.getElementById('hamburger-menu');
  const navLinks = document.getElementById('nav-links');

  if (hamburgerMenu && navLinks) {
    hamburgerMenu.addEventListener('click', function() {
      hamburgerMenu.classList.toggle('active');
      navLinks.classList.toggle('active');
    });

    // Close menu when a link is clicked
    const links = navLinks.querySelectorAll('a');
    links.forEach(link => {
      link.addEventListener('click', function() {
        hamburgerMenu.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });
  }
});
