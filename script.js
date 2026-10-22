
const $ = id => document.getElementById(id);

const usernameInput = $("username");
const searchBtn = $("searchBtn");
const profile = $("profile");
const error = $("error");
const status = $("status");

let currentRepositories = [];

const numberFormat = value =>
    Number(value || 0).toLocaleString();

function showMessage(element, message) {
    element.textContent = message;
    element.hidden = !message;
}

function validateUsername(username) {
    return /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(username);
}

async function api(path) {
    const response = await fetch(`https://api.github.com${path}`, {
        headers: { Accept: "application/vnd.github+json" }
    });

    if (response.status === 404) {
        throw new Error("GitHub user or resource not found.");
    }

    if (response.status === 403) {
        throw new Error(
            "GitHub API rate limit reached. Please wait and try again."
        );
    }

    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
    }

    return response.json();
}

$("searchBtn").addEventListener("click", analyzeProfile);

usernameInput.addEventListener("keydown", event => {
    if (event.key === "Enter") analyzeProfile();
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

    try {
        const user = await api(`/users/${encodeURIComponent(username)}`);
        const repositories = await api(
            `/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`
        );

        currentRepositories = repositories;

        displayProfile(user);
        displayRepositories();
        displayLanguages(repositories);
        await displayActivity(username);

        profile.hidden = false;
        showMessage(status, "");
    } catch (err) {
        showMessage(error, err.message || "Something went wrong.");
        showMessage(status, "");
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
    $("bio").textContent = user.bio || "No bio available.";
    $("location").textContent = user.location
        ? `📍 ${user.location}`
        : "";

    $("repos").textContent = numberFormat(user.public_repos);
    $("followers").textContent = numberFormat(user.followers);
    $("following").textContent = numberFormat(user.following);

    const totalStars = currentRepositories.reduce(
        (sum, repo) => sum + repo.stargazers_count, 0
    );

    $("stars").textContent = numberFormat(totalStars);
    $("githubLink").href = user.html_url;
}

function displayRepositories() {
    const query = $("repoSearch").value.trim().toLowerCase();
    const sortBy = $("repoSort").value;
    const list = $("repoList");

    const filtered = currentRepositories.filter(repo =>
        repo.name.toLowerCase().includes(query) ||
        (repo.description || "").toLowerCase().includes(query)
    );

    filtered.sort((a, b) => {
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
        `${filtered.length} repositories shown (of ${currentRepositories.length} loaded)`;

    list.replaceChildren();

    if (!filtered.length) {
        list.textContent = "No matching repositories found.";
        return;
    }

    filtered.forEach(repo => {
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
            `⭐ ${numberFormat(repo.stargazers_count)}`,
            `🍴 ${numberFormat(repo.forks_count)}`,
            `● ${repo.language || "No language"}`,
            repo.private ? "Private" : "Public"
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

$("repoSearch").addEventListener("input", displayRepositories);
$("repoSort").addEventListener("change", displayRepositories);

function displayLanguages(repositories) {
    const counts = {};

    repositories.forEach(repo => {
        if (repo.language) {
            counts[repo.language] = (counts[repo.language] || 0) + 1;
        }
    });

    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((sum, entry) => sum + entry[1], 0);

    const chart = $("languageChart");
    const list = $("languageList");

    chart.replaceChildren();
    list.replaceChildren();

    if (!total) {
        list.textContent = "No language data available.";
        return;
    }

    // Fixed palette keeps the chart readable and predictable.
    const colors = [
        "#0969da", "#8250df", "#1a7f37", "#bf8700",
        "#cf222e", "#218bff", "#bc4c00", "#6e7781"
    ];

    entries.forEach(([language, count], index) => {
        const percent = count / total * 100;

        const segment = document.createElement("div");
        segment.className = "language-segment";
        segment.style.width = `${percent}%`;
        segment.style.backgroundColor = colors[index % colors.length];
        segment.title = `${language}: ${percent.toFixed(1)}%`;
        chart.appendChild(segment);

        const item = document.createElement("div");
        item.className = "language-item";

        const name = document.createElement("span");
        name.textContent = language;

        const value = document.createElement("span");
        value.textContent = `${percent.toFixed(1)}% · ${count} repos`;

        item.append(name, value);
        list.appendChild(item);
    });
}

async function displayActivity(username) {
    const list = $("activityList");
    list.replaceChildren();

    try {
        const events = await api(
            `/users/${encodeURIComponent(username)}/events/public?per_page=10`
        );

        if (!events.length) {
            list.textContent = "No recent public activity found.";
            return;
        }

        events.forEach(event => {
            const item = document.createElement("div");
            item.className = "activity-item";

            const repoLink = document.createElement("a");
            repoLink.href = `https://github.com/${event.repo.name}`;
            repoLink.target = "_blank";
            repoLink.rel = "noopener noreferrer";
            repoLink.textContent = event.repo.name;

            const type = event.type.replace("Event", "");
            const date = new Date(event.created_at).toLocaleDateString();

            item.append(
                document.createTextNode(`${type} · `),
                repoLink,
                document.createTextNode(` · ${date}`)
            );

            list.appendChild(item);
        });
    } catch {
        list.textContent = "Could not load recent public activity.";
    }
}

$("compareBtn").addEventListener("click", compareProfiles);

async function compareProfiles() {
    const first = $("compareUser1").value.trim();
    const second = $("compareUser2").value.trim();

    showMessage($("compareError"), "");
    $("compareResult").hidden = true;

    if (!validateUsername(first) || !validateUsername(second)) {
        showMessage(
            $("compareError"),
            "Enter two valid GitHub usernames."
        );
        return;
    }

    if (first.toLowerCase() === second.toLowerCase()) {
        showMessage(
            $("compareError"),
            "Enter two different GitHub usernames."
        );
        return;
    }

    const button = $("compareBtn");
    button.disabled = true;
    button.textContent = "Comparing...";

    try {
        const [userA, userB, reposA, reposB] = await Promise.all([
            api(`/users/${encodeURIComponent(first)}`),
            api(`/users/${encodeURIComponent(second)}`),
            api(`/users/${encodeURIComponent(first)}/repos?per_page=100`),
            api(`/users/${encodeURIComponent(second)}/repos?per_page=100`)
        ]);

        const starsA = reposA.reduce(
            (sum, repo) => sum + repo.stargazers_count, 0
        );
        const starsB = reposB.reduce(
            (sum, repo) => sum + repo.stargazers_count, 0
        );

        $("compareProfiles").replaceChildren(
            createCompareCard(userA),
            createCompareCard(userB)
        );

        const rows = [
            ["Public repositories", userA.public_repos, userB.public_repos],
            ["Followers", userA.followers, userB.followers],
            ["Following", userA.following, userB.following],
            ["Stars (loaded repos)", starsA, starsB]
        ];

        const table = document.createElement("table");
        table.className = "compare-table";

        const head = document.createElement("tr");
        ["Statistic", userA.login, userB.login].forEach(text => {
            const th = document.createElement("th");
            th.textContent = text;
            head.appendChild(th);
        });

        const thead = document.createElement("thead");
        thead.appendChild(head);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");

        rows.forEach(([label, valueA, valueB]) => {
            const row = document.createElement("tr");
            const labelCell = document.createElement("th");
            labelCell.textContent = label;
            row.appendChild(labelCell);

            [valueA, valueB].forEach((value, index) => {
                const cell = document.createElement("td");
                cell.textContent = numberFormat(value);

                const other = index === 0 ? valueB : valueA;
                if (value > other) cell.className = "winner";

                row.appendChild(cell);
            });

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        $("compareStats").replaceChildren(table);
        $("compareResult").hidden = false;
    } catch (err) {
        showMessage($("compareError"), err.message);
    } finally {
        button.disabled = false;
        button.textContent = "Compare";
    }
}

function createCompareCard(user) {
    const card = document.createElement("div");
    card.className = "compare-user";

    const avatar = document.createElement("img");
    avatar.className = "compare-avatar";
    avatar.src = user.avatar_url;
    avatar.alt = `${user.login} avatar`;

    const name = document.createElement("p");
    name.textContent = user.name || user.login;

    const link = document.createElement("a");
    link.href = user.html_url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = `@${user.login}`;

    card.append(avatar, name, link);
    return card;
}
