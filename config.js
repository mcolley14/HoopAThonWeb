// Site configuration. The signup endpoint is the Google Apps Script web app URL
// (Deploy → Manage deployments → Web app URL). See apps-script/README.md.

window.HOOPATHON_CONFIG = {
  signupEndpoint: "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec",
  // Optional: sponsorship "Contact Us" button (mailto). corporateContactEmail wins if both set.
  corporateContactEmail: "",
  sponsorshipEmail: "",
};
