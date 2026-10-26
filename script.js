(function () {
  const config = window.HOOPATHON_CONFIG || {};
  // Google Apps Script web app URL (see apps-script/README.md).
  const endpoint = config.signupEndpoint || "";
  const useEndpoint = endpoint && !endpoint.includes("YOUR_DEPLOYMENT_ID");

  // No custom headers, so the browser sends a "simple" request and skips the
  // CORS preflight, which Apps Script cannot answer.
  async function submitSignup(payload) {
    const response = await fetch(endpoint, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || "Registration failed.");
    return result;
  }

  async function withPending(form, task) {
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    try {
      return await task();
    } finally {
      button.disabled = false;
      button.removeAttribute("aria-busy");
    }
  }

  const individualForm = document.getElementById("individualForm");
  const teamForm = document.getElementById("teamForm");
  const participantCount = document.getElementById("participantCount");

  const sponsorshipBtn = document.getElementById("sponsorshipContactBtn");
  if (sponsorshipBtn) {
    const email = config.corporateContactEmail || config.sponsorshipEmail;
    if (email) sponsorshipBtn.href = "mailto:" + email;
  }

  function setMessage(id, text, isError) {
    const target = document.getElementById(id);
    if (!target) return;
    target.textContent = text;
    target.classList.remove("success", "error");
    target.classList.add(isError ? "error" : "success");
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function parseTeamParticipantNames(raw) {
    return String(raw || "")
      .split(/\r?\n/)
      .map(function (line) {
        return line.trim();
      })
      .filter(Boolean);
  }

  async function updateStats() {
    if (!participantCount) return;
    if (useEndpoint) {
      try {
        const response = await fetch(endpoint);
        const data = await response.json();
        participantCount.textContent = String(data.participants ?? 0);
      } catch (err) {
        participantCount.textContent = "—";
      }
    } else {
      participantCount.textContent = "—";
    }
  }

  individualForm.addEventListener("submit", async function (event) {
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

    if (!useEndpoint) {
      setMessage(
        "individualMessage",
        "Signups are not open yet. Please check back soon.",
        true
      );
      return;
    }

    try {
      await withPending(individualForm, function () {
        return submitSignup({
          type: "individual",
          website: individualForm.elements.website.value,
          participantName: participantName,
          participantEmail: participantEmail,
          participantPhone: participantPhone,
          participantGoal: participantGoal,
        });
      });
    } catch (err) {
      setMessage(
        "individualMessage",
        "Registration failed. Please try again or contact us.",
        true
      );
      return;
    }

    setMessage("individualMessage", "You are registered for Hoop-A-Thon. Thank you.", false);
    individualForm.reset();
    document.getElementById("participantGoal").value = "500";
    await updateStats();
  });

  teamForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const companyName = String(document.getElementById("companyName").value || "").trim();
    const teamContact = String(document.getElementById("teamContact").value || "").trim();
    const teamEmail = String(document.getElementById("teamEmail").value || "").trim();
    const teamSize = Number(document.getElementById("teamSize").value || 0);
    const participantNames = parseTeamParticipantNames(
      document.getElementById("teamParticipantNames").value
    );

    if (!companyName) {
      setMessage("teamMessage", "Please enter company name.", true);
      return;
    }
    if (!teamContact) {
      setMessage("teamMessage", "Please enter team contact name.", true);
      return;
    }
    if (!isValidEmail(teamEmail)) {
      setMessage("teamMessage", "Please enter a valid corporate email.", true);
      return;
    }
    if (!Number.isInteger(teamSize) || teamSize < 2) {
      setMessage("teamMessage", "Team size must be at least 2.", true);
      return;
    }
    if (participantNames.length < 2) {
      setMessage(
        "teamMessage",
        "Please list at least two participant names (one per line).",
        true
      );
      return;
    }
    if (participantNames.length > teamSize) {
      setMessage(
        "teamMessage",
        "You listed more names than your expected team size. Add rows or increase team size.",
        true
      );
      return;
    }

    if (!useEndpoint) {
      setMessage("teamMessage", "Signups are not open yet. Please check back soon.", true);
      return;
    }

    try {
      await withPending(teamForm, function () {
        return submitSignup({
          type: "team",
          website: teamForm.elements.website.value,
          companyName: companyName,
          teamContact: teamContact,
          teamEmail: teamEmail,
          teamSize: teamSize,
          participantNames: participantNames.join("\n"),
        });
      });
    } catch (err) {
      setMessage(
        "teamMessage",
        "Registration failed. Please try again or contact us.",
        true
      );
      return;
    }

    setMessage("teamMessage", "Corporate team registration received. Thank you.", false);
    teamForm.reset();
    await updateStats();
  });

  void updateStats();
})();
