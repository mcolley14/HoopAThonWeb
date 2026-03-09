(function () {
  const config = window.HOOPATHON_CONFIG || {};
  const supabaseUrl = config.supabaseUrl || "";
  const supabaseAnonKey = config.supabaseAnonKey || "";
  const useSupabase =
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes("your-project-id");

  const supabase = useSupabase
    ? window.supabase.createClient(supabaseUrl, supabaseAnonKey)
    : null;

  const individualForm = document.getElementById("individualForm");
  const teamForm = document.getElementById("teamForm");
  const individualCount = document.getElementById("individualCount");
  const teamCount = document.getElementById("teamCount");

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

  async function updateStats() {
    if (useSupabase && supabase) {
      try {
        const { data, error } = await supabase.rpc("get_signup_counts");
        if (error) throw error;
        if (data) {
          individualCount.textContent = String(data.individuals ?? 0);
          teamCount.textContent = String(data.teams ?? 0);
        }
      } catch (err) {
        individualCount.textContent = "—";
        teamCount.textContent = "—";
      }
    } else {
      individualCount.textContent = "—";
      teamCount.textContent = "—";
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

    if (useSupabase && supabase) {
      const { error } = await supabase.from("individual_signups").insert({
        participant_name: participantName,
        participant_email: participantEmail,
        participant_phone: participantPhone || null,
        participant_goal: participantGoal,
      });

      if (error) {
        setMessage(
          "individualMessage",
          "Registration failed. Please try again or contact us.",
          true
        );
        return;
      }
    } else {
      setMessage(
        "individualMessage",
        "Supabase is not configured. Add your credentials to config.js.",
        true
      );
      return;
    }

    setMessage("individualMessage", "You are registered for HoopAThon. Thank you!", false);
    individualForm.reset();
    document.getElementById("participantGoal").value = "500";
    updateStats();
  });

  teamForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const companyName = String(document.getElementById("companyName").value || "").trim();
    const teamContact = String(document.getElementById("teamContact").value || "").trim();
    const teamEmail = String(document.getElementById("teamEmail").value || "").trim();
    const teamSize = Number(document.getElementById("teamSize").value || 0);

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

    if (useSupabase && supabase) {
      const { error } = await supabase.from("team_signups").insert({
        company_name: companyName,
        team_contact: teamContact,
        team_email: teamEmail,
        team_size: teamSize,
      });

      if (error) {
        setMessage(
          "teamMessage",
          "Registration failed. Please try again or contact us.",
          true
        );
        return;
      }
    } else {
      setMessage(
        "teamMessage",
        "Supabase is not configured. Add your credentials to config.js.",
        true
      );
      return;
    }

    setMessage("teamMessage", "Corporate team registration received. Thank you!", false);
    teamForm.reset();
    updateStats();
  });

  updateStats();
})();
