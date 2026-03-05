(function () {
  const storageKeys = {
    donations: "hoopathon_donations",
    individuals: "hoopathon_individual_signups",
    teams: "hoopathon_team_signups",
  };

  const donationForm = document.getElementById("donationForm");
  const individualForm = document.getElementById("individualForm");
  const teamForm = document.getElementById("teamForm");
  const donationType = document.getElementById("donationType");
  const pledgeAmount = document.getElementById("pledgeAmount");
  const expectedBaskets = document.getElementById("expectedBaskets");
  const basketRow = document.getElementById("basketRow");
  const donationEstimate = document.getElementById("donationEstimate");
  const donateButton = document.getElementById("donateButton");

  const individualCount = document.getElementById("individualCount");
  const teamCount = document.getElementById("teamCount");
  const donationCount = document.getElementById("donationCount");

  function readItems(key) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      return [];
    }
  }

  function saveItems(key, items) {
    try {
      window.localStorage.setItem(key, JSON.stringify(items));
    } catch (error) {
      // Keep UI usable even if storage is disabled.
    }
  }

  function setMessage(id, text, isError) {
    const target = document.getElementById(id);
    target.textContent = text;
    target.classList.remove("success", "error");
    target.classList.add(isError ? "error" : "success");
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function currency(value) {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 2,
    }).format(value);
  }

  function updateStats() {
    individualCount.textContent = String(readItems(storageKeys.individuals).length);
    teamCount.textContent = String(readItems(storageKeys.teams).length);
    donationCount.textContent = String(readItems(storageKeys.donations).length);
  }

  function updateDonationEstimate() {
    const amount = Number(pledgeAmount.value || 0);
    const baskets = Number(expectedBaskets.value || 0);
    const type = donationType.value;

    basketRow.style.display = type === "per_basket" ? "block" : "none";

    let total = amount;
    if (type === "per_basket") {
      total = amount * baskets;
    }

    if (!Number.isFinite(total) || total < 0) {
      total = 0;
    }

    donationEstimate.textContent = "Estimated total: " + currency(total);
  }

  donationType.addEventListener("change", updateDonationEstimate);
  pledgeAmount.addEventListener("input", updateDonationEstimate);
  expectedBaskets.addEventListener("input", updateDonationEstimate);

  donateButton.addEventListener("click", function () {
    const donateSection = document.getElementById("donate");
    donateSection.scrollIntoView({ behavior: "smooth", block: "start" });
    document.getElementById("donorName").focus();
  });

  donationForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const donorName = String(document.getElementById("donorName").value || "").trim();
    const donorEmail = String(document.getElementById("donorEmail").value || "").trim();
    const type = donationType.value;
    const amount = Number(pledgeAmount.value || 0);
    const baskets = Number(expectedBaskets.value || 0);

    if (!donorName) {
      setMessage("donationMessage", "Please enter the donor name.", true);
      return;
    }
    if (!isValidEmail(donorEmail)) {
      setMessage("donationMessage", "Please enter a valid donor email.", true);
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage("donationMessage", "Pledge amount must be greater than zero.", true);
      return;
    }
    if (type === "per_basket" && (!Number.isInteger(baskets) || baskets <= 0)) {
      setMessage("donationMessage", "Expected baskets must be a positive whole number.", true);
      return;
    }

    const estimatedTotal = type === "per_basket" ? amount * baskets : amount;
    const donations = readItems(storageKeys.donations);
    donations.push({
      donorName,
      donorEmail,
      type,
      amount,
      baskets: type === "per_basket" ? baskets : null,
      estimatedTotal,
      submittedAt: new Date().toISOString(),
    });
    saveItems(storageKeys.donations, donations);

    setMessage(
      "donationMessage",
      "Thank you. Donation pledge recorded: " + currency(estimatedTotal) + ".",
      false
    );
    donationForm.reset();
    expectedBaskets.value = "25";
    updateDonationEstimate();
    updateStats();
  });

  individualForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const participantName = String(
      document.getElementById("participantName").value || ""
    ).trim();
    const participantEmail = String(
      document.getElementById("participantEmail").value || ""
    ).trim();
    const participantPhone = String(
      document.getElementById("participantPhone").value || ""
    ).trim();
    const participantGoal = Number(
      document.getElementById("participantGoal").value || 0
    );

    if (!participantName) {
      setMessage("individualMessage", "Please enter participant full name.", true);
      return;
    }
    if (!isValidEmail(participantEmail)) {
      setMessage("individualMessage", "Please enter a valid participant email.", true);
      return;
    }
    if (!Number.isFinite(participantGoal) || participantGoal < 0) {
      setMessage("individualMessage", "Fundraising goal must be zero or higher.", true);
      return;
    }

    const individuals = readItems(storageKeys.individuals);
    individuals.push({
      participantName,
      participantEmail,
      participantPhone,
      participantGoal,
      submittedAt: new Date().toISOString(),
    });
    saveItems(storageKeys.individuals, individuals);

    setMessage("individualMessage", "You are registered for HoopAThon. Thank you!", false);
    individualForm.reset();
    document.getElementById("participantGoal").value = "500";
    updateStats();
  });

  teamForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const companyName = String(document.getElementById("companyName").value || "").trim();
    const teamContact = String(document.getElementById("teamContact").value || "").trim();
    const teamEmail = String(document.getElementById("teamEmail").value || "").trim();
    const teamSize = Number(document.getElementById("teamSize").value || 0);
    const sponsorshipLevel = document.getElementById("sponsorshipLevel").value;

    if (!companyName) {
      setMessage("teamMessage", "Please enter company name.", true);
      return;
    }
    if (!teamContact) {
      setMessage("teamMessage", "Please enter team contact name.", true);
      return;
    }
    if (!isValidEmail(teamEmail)) {
      setMessage("teamMessage", "Please enter a valid team contact email.", true);
      return;
    }
    if (!Number.isInteger(teamSize) || teamSize < 2) {
      setMessage("teamMessage", "Team size must be at least 2.", true);
      return;
    }

    const teams = readItems(storageKeys.teams);
    teams.push({
      companyName,
      teamContact,
      teamEmail,
      teamSize,
      sponsorshipLevel,
      submittedAt: new Date().toISOString(),
    });
    saveItems(storageKeys.teams, teams);

    setMessage("teamMessage", "Corporate team registration received. Thank you!", false);
    teamForm.reset();
    updateStats();
  });

  updateDonationEstimate();
  updateStats();
})();
