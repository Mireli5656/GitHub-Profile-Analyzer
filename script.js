const usernameInput = document.getElementById("username");
const searchBtn = document.getElementById("searchBtn");

const profile = document.getElementById("profile");
const error = document.getElementById("error");

const avatar = document.getElementById("avatar");
const name = document.getElementById("name");
const login = document.getElementById("login");
const bio = document.getElementById("bio");

const repos = document.getElementById("repos");
const followers = document.getElementById("followers");
const following = document.getElementById("following");
const stars = document.getElementById("stars");

const languageList = document.getElementById("languageList");
const repoList = document.getElementById("repoList");
const githubLink = document.getElementById("githubLink");


searchBtn.addEventListener("click", analyzeProfile);

usernameInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        analyzeProfile();
    }
});


async function analyzeProfile() {
    const username = usernameInput.value.trim();

    if (!username) {
        showError("Please enter a GitHub username.");
        return;
    }

    hideError();
    profile.hidden = true;

    searchBtn.disabled = true;
    searchBtn.textContent = "Analyzing...";

    try {
        const userResponse = await fetch(
            `https://api.github.com/users/${encodeURIComponent(username)}`
        );

        if (!userResponse.ok) {
            throw new Error("GitHub user not found.");
        }

        const user = await userResponse.json();

        displayProfile(user);

        const reposResponse = await fetch(
            `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=stars`
        );

        if (!reposResponse.ok) {
            throw new Error("Could not load repositories.");
        }

        const repositories = await reposResponse.json();

        displayRepositories(repositories);
        displayLanguages(repositories);

        profile.hidden = false;

    } catch (err) {
        showError(err.message);
    } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = "Analyze";
    }
}


function displayProfile(user) {
    avatar.src = user.avatar_url;
    avatar.alt = `${user.login} avatar`;

    name.textContent = user.name || user.login;
    login.textContent = `@${user.login}`;

    bio.textContent = user.bio || "No bio available.";

    repos.textContent = user.public_repos;
    followers.textContent = user.followers;
    following.textContent = user.following;

    githubLink.href = user.html_url;
}


function displayRepositories(repositories) {
    repoList.innerHTML = "";

    if (repositories.length === 0) {
        repoList.innerHTML = "<p>No public repositories found.</p>";
        return;
    }

    const topRepositories = repositories
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 6);

    let totalStars = 0;

    repositories.forEach(repo => {
        totalStars += repo.stargazers_count;
    });

    stars.textContent = totalStars;

    topRepositories.forEach(repo => {
        const card = document.createElement("div");
        card.className = "repo-card";

        const title = document.createElement("h4");
        title.textContent = repo.name;

        const description = document.createElement("p");
        description.textContent =
            repo.description || "No description available.";

        const details = document.createElement("p");
        details.textContent =
            `⭐ ${repo.stargazers_count}  •  🍴 ${repo.forks_count}`;

        card.appendChild(title);
        card.appendChild(description);
        card.appendChild(details);

        card.addEventListener("click", () => {
            window.open(repo.html_url, "_blank");
        });

        repoList.appendChild(card);
    });
}


function displayLanguages(repositories) {
    languageList.innerHTML = "";

    const languages = {};

    repositories.forEach(repo => {
        if (repo.language) {
            languages[repo.language] =
                (languages[repo.language] || 0) + 1;
        }
    });

    const sortedLanguages = Object.entries(languages)
        .sort((a, b) => b[1] - a[1]);

    if (sortedLanguages.length === 0) {
        languageList.innerHTML = "<p>No language data available.</p>";
        return;
    }

    sortedLanguages.forEach(([language, count]) => {
        const item = document.createElement("div");

        item.textContent = `${language} — ${count} repositories`;

        languageList.appendChild(item);
    });
}


function showError(message) {
    error.textContent = message;
    error.hidden = false;
    profile.hidden = true;
}


function hideError() {
    error.textContent = "";
    error.hidden = true;
  }
