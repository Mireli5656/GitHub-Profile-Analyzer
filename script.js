const $ = id => document.getElementById(id);

const usernameInput = $("username");
const searchBtn = $("searchBtn");
const profile = $("profile");
const error = $("error");
const status = $("status");

let currentRepositories = [];

const LANGUAGE_REPO_LIMIT = 15;
const COMMIT_REPO_LIMIT = 8;
const MAX_COMMITS = 10;

const LANGUAGE_COLORS = [
    "#0969da",
    "#8250df",
    "#1a7f37",
    "#bf8700",
    "#cf222e",
    "#218bff",
    "#bc4c00",
    "#6e7781",
    "#0f766e",
    "#db2777"
];

const numberFormat = value =>
    Number(value || 0).toLocaleString();

function showMessage(element, message) {
    element.textContent = message;
    element.hidden = !message;
}

function validateUsername(username) {
    return /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/
        .test(username);
}

async function api(path) {
    const response = await fetch(
        `https://api.github.com${path}`,
        {
            headers: {
                Accept: "application/vnd.github+json"
            }
        }
    );

    if (response.status === 404) {
        throw new Error("GitHub user or resource not found.");
    }

    if (response.status === 403) {
        const remaining = response.headers.get(
            "X-RateLimit-Remaining"
        );

        if (remaining === "0") {
            throw new Error(
                "GitHub API rate limit reached. Please try again later."
            );
        }

        throw new Error(
            "GitHub API denied the request. Please try again later."
        );
    }

    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
    }

    return response.json();
}

async function mapWithConcurrency(items, limit, task) {
    const results = new Array(items.length);
    let nextIndex = 0;

    async function worker() {
        while (true) {
            const index = nextIndex++;

            if (index >= items.length) {
                return;
            }

            try {
                results[index] = await task(items[index]);
            } catch {
                results[index] = null;
            }
        }
    }

    const workers = Math.min(limit, items.length);

    await Promise.all(
        Array.from({ length: workers }, () => worker())
    );

    return results;
}

function formatBytes(bytes) {
    if (bytes < 1024) {
        return `${numberFormat(bytes)} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    if (bytes < 1024 * 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

searchBtn.addEventListener("click", analyzeProfile);

usernameInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        analyzeProfile();
    }
});

async function analyzeProfile() {
    const username = usernameInput.value.trim();

    if (!validateUsername(username)) {
        showMessage(error, "Please enter a valid GitHub username.");
        profile.hidden = true;
        return;
    }

    showMessage(error, "");
    showMessage(status, "Loading profile and repositories...");

    profile.hidden = true;
    searchBtn.disabled = true;
    searchBtn.textContent = "Analyzing...";

    $("languageChart").replaceChildren();
    $("languageList").replaceChildren();
    $("commitList").replaceChildren();

    try {
        const encodedUsername = encodeURIComponent(username);

        const [user, repositories] = await Promise.all([
            api(`/users/${encodedUsername}`),

            api(
                `/users/${encodedUsername}/repos?per_page=100&sort=updated&type=owner`
            )
        ]);

        currentRepositories = repositories;

        displayProfile(user);
        displayRepositories();

        profile.hidden = false;

        showMessage(
            status,
            "Loading language byte statistics and latest commits..."
        );

        await Promise.all([
            displayLanguages(user.login, repositories),
            displayLatestCommits(user.login, repositories)
        ]);

        showMessage(status, "");
    } catch (err) {
        showMessage(
            error,
            err.message || "Something went wrong."
        );

        showMessage(status, "");
        profile.hidden = true;
    } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = "Analyze";
    }
}

function displayProfile(user) {
    $("avatar").src = user.avatar_url;
    $("avatar").alt = `${user.login} avatar`;

    $("name").textContent = user.name || user.login;
    $("login").textContent = `@${user.login}`;

    $("bio").textContent =
        user.bio || "No bio available.";

    $("location").textContent = user.location
        ? `📍 ${user.location}`
        : "";

    $("repos").textContent = numberFormat(user.public_repos);
    $("followers").textContent = numberFormat(user.followers);
    $("following").textContent = numberFormat(user.following);

    const totalStars = currentRepositories.reduce(
        (sum, repo) => sum + repo.stargazers_count,
        0
    );

    $("stars").textContent = numberFormat(totalStars);
    $("githubLink").href = user.html_url;
}

function displayRepositories() {
    const sortBy = $("repoSort").value;
    const list = $("repoList");

    const sorted = [...currentRepositories];

    sorted.sort((a, b) => {
        if (sortBy === "stars") {
            return b.stargazers_count - a.stargazers_count;
        }

        if (sortBy === "forks") {
            return b.forks_count - a.forks_count;
        }

        if (sortBy === "updated") {
            return new Date(b.updated_at) - new Date(a.updated_at);
        }

        return a.name.localeCompare(b.name);
    });

    $("repoCount").textContent =
        `${sorted.length} repositories loaded`;

    list.replaceChildren();

    if (sorted.length === 0) {
        list.textContent = "No public repositories found.";
        return;
    }

    sorted.forEach(repo => {
        const card = document.createElement("article");
        card.className = "repo-card";

        const title = document.createElement("a");
        title.className = "repo-name";
        title.href = repo.html_url;
        title.target = "_blank";
        title.rel = "noopener noreferrer";
        title.textContent = repo.name;

        const description = document.createElement("p");
        description.className = "repo-description";
        description.textContent =
            repo.description || "No description available.";

        const meta = document.createElement("div");
        meta.className = "repo-meta";

        [
            `⭐ ${numberFormat(repo.stargazers_count)} stars`,
            `🍴 ${numberFormat(repo.forks_count)} forks`,
            `● ${repo.language || "No language"}`,
            repo.fork ? "Fork" : "Original repository"
        ].forEach(text => {
            const item = document.createElement("span");
            item.textContent = text;
            meta.appendChild(item);
        });

        const details = document.createElement("div");
        details.className = "repo-details";

        details.textContent =
            `Open issues: ${numberFormat(repo.open_issues_count)} · ` +
            `Created: ${new Date(repo.created_at).toLocaleDateString()} · ` +
            `Updated: ${new Date(repo.updated_at).toLocaleDateString()}`;

        card.append(title, description, meta, details);
        list.appendChild(card);
    });
}

$("repoSort").addEventListener("change", displayRepositories);

async function displayLanguages(username, repositories) {
    const chart = $("languageChart");
    const list = $("languageList");
    const note = $("languageNote");

    chart.replaceChildren();
    list.replaceChildren();

    const selected = repositories.slice(0, LANGUAGE_REPO_LIMIT);

    if (selected.length === 0) {
        note.textContent = "No public repositories to analyze.";
        return;
    }

    note.textContent =
        `Calculating code-byte percentages from up to ` +
        `${selected.length} recently updated public repositories...`;

    const results = await mapWithConcurrency(
        selected,
        4,
        async repo => {
            const owner = repo.full_name.split("/")[0];

            return await api(
                `/repos/${encodeURIComponent(owner)}/` +
                `${encodeURIComponent(repo.name)}/languages`
            );
        }
    );

    const totals = {};
    let successfulRepos = 0;

    results.forEach(languageData => {
        if (!languageData) return;

        successfulRepos++;

        Object.entries(languageData).forEach(([language, bytes]) => {
            totals[language] = (totals[language] || 0) + bytes;
        });
    });

    const entries = Object.entries(totals)
        .sort((a, b) => b[1] - a[1]);

    const totalBytes = entries.reduce(
        (sum, [, bytes]) => sum + bytes,
        0
    );

    if (successfulRepos === 0 || totalBytes === 0) {
        note.textContent =
            "Language statistics are unavailable for these repositories. Try again later.";

        return;
    }

    note.textContent =
        `Based on code bytes from ${successfulRepos} public repositories. ` +
        `Percentages show each language's share of the measured code.`;

    entries.forEach(([language, bytes], index) => {
        const percentage = bytes / totalBytes * 100;
        const color =
            LANGUAGE_COLORS[index % LANGUAGE_COLORS.length];

        const segment = document.createElement("div");
        segment.className = "language-segment";
        segment.style.width = `${percentage}%`;
        segment.style.backgroundColor = color;

        segment.title =
            `${language}: ${percentage.toFixed(2)}%`;

        chart.appendChild(segment);

        const item = document.createElement("div");
        item.className = "language-item";

        const label = document.createElement("div");
        label.className = "language-label";

        const dot = document.createElement("span");
        dot.className = "language-dot";
        dot.style.backgroundColor = color;

        const name = document.createElement("span");
        name.className = "language-name";
        name.textContent = language;

        const value = document.createElement("span");
        value.className = "language-value";
        value.textContent =
            `${percentage.toFixed(2)}% · ${formatBytes(bytes)}`;

        label.append(dot, name);
        item.append(label, value);
        list.appendChild(item);
    });
}

async function displayLatestCommits(username, repositories) {
    const list = $("commitList");
    list.replaceChildren();

    const selected = repositories.slice(0, COMMIT_REPO_LIMIT);

    if (selected.length === 0) {
        list.textContent = "No repositories found.";
        return;
    }

    const results = await mapWithConcurrency(
        selected,
        4,
        async repo => {
            const owner = repo.full_name.split("/")[0];

            const commits = await api(
                `/repos/${encodeURIComponent(owner)}/` +
                `${encodeURIComponent(repo.name)}/commits` +
                `?author=${encodeURIComponent(username)}&per_page=3`
            );

            return commits.map(commit => ({
                ...commit,
                repository: repo
            }));
        }
    );

    const commits = results
        .filter(Boolean)
        .flat()
        .sort((a, b) => {
            const dateA =
                a.commit.author?.date ||
                a.commit.committer?.date ||
                "";

            const dateB =
                b.commit.author?.date ||
                b.commit.committer?.date ||
                "";

            return new Date(dateB) - new Date(dateA);
        });

    const uniqueCommits = [];
    const seen = new Set();

    for (const commit of commits) {
        if (seen.has(commit.sha)) continue;

        seen.add(commit.sha);
        uniqueCommits.push(commit);

        if (uniqueCommits.length >= MAX_COMMITS) break;
    }

    if (uniqueCommits.length === 0) {
        list.textContent =
            "No recent commits by this user were found in the checked repositories.";

        return;
    }

    uniqueCommits.forEach(commit => {
        const card = document.createElement("article");
        card.className = "commit-card";

        const message = document.createElement("a");
        message.className = "commit-message";
        message.href = commit.html_url;
        message.target = "_blank";
        message.rel = "noopener noreferrer";

        const firstLine =
            commit.commit.message.split("\n")[0].trim();

        message.textContent =
            firstLine || "Commit without a message";

        const meta = document.createElement("div");
        meta.className = "commit-meta";

        const repoLink = document.createElement("a");
        repoLink.href = commit.repository.html_url;
        repoLink.target = "_blank";
        repoLink.rel = "noopener noreferrer";
        repoLink.textContent = commit.repository.name;

        const rawDate =
            commit.commit.author?.date ||
            commit.commit.committer?.date;

        const date = document.createElement("span");
        date.textContent = rawDate
            ? new Date(rawDate).toLocaleString()
            : "Date unavailable";

        const sha = document.createElement("span");
        sha.textContent = commit.sha.slice(0, 7);

        meta.append(repoLink, date, sha);
        card.append(message, meta);
        list.appendChild(card);
    });
            }
