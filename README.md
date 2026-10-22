# GitHub Profile Analyzer

A simple, responsive web application for analyzing public GitHub profiles, programming language usage, repositories, and recent commits.

## 🌐 Live Demo

[Open GitHub Profile Analyzer](https://mireli5656.github.io/GitHub-Profile-Analyzer/)

## ✨ Features

- **Profile Analysis** — View a user's avatar, name, bio, location, and GitHub profile link.
- **Profile Statistics** — View public repositories, followers, following, and stars.
- **Programming Language Usage** — Analyze programming languages by code bytes and display their percentages in a visual chart.
- **Repository Explorer** — Browse public repositories with descriptions, stars, forks, open issues, and update dates.
- **Repository Sorting** — Sort repositories by stars, forks, last update, or name.
- **Latest Commits** — View recent commits authored by the selected user in public repositories.
- **Responsive Design** — Use the application on mobile devices and desktop browsers.
- **No Login Required** — Analyze public GitHub profiles without connecting a GitHub account.

## 🚀 How to Use

1. Open the [live demo](https://mireli5656.github.io/GitHub-Profile-Analyzer/).
2. Enter a GitHub username.
3. Click **Analyze** or press `Enter`.
4. Explore the profile statistics and programming language percentages.
5. Browse repositories and sort them using the available options.
6. View recent commits and open repository or commit links for more details.

## 🛠️ Technologies Used

- HTML5
- CSS3
- JavaScript
- GitHub REST API

## 📊 How Language Percentages Work

The application retrieves language statistics from GitHub's repository Languages API.

- Language usage is calculated from the number of code bytes reported for each language.
- Percentages represent each language's share of the measured code.
- Language analysis checks up to 15 recently updated public repositories.

> **Note:** These percentages represent measured code bytes, not the percentage of repositories using each language. Results may not cover every repository in a user's account.

## 📝 Repository and Commit Limits

| Data | Limit |
|---|---|
| Public repositories loaded | Up to 100 |
| Repositories used for language statistics | Up to 15 (recently updated) |
| Repositories checked for recent commits | Up to 8 (recently updated) |
| Commits displayed | Up to 10 |

These limits help reduce API requests and improve loading performance.

## 🔐 Privacy

- No account login is required.
- No backend or database is used.
- Profile information is retrieved directly from the public GitHub REST API.
- The application does not require a personal access token.
- GitHub API rate limits may affect requests when usage is high.

## 📂 Project Structure

```text
GitHub-Profile-Analyzer/
├── index.html
├── style.css
├── script.js
├── README.md
└── LICENSE
```

## 💻 Run Locally

Clone the repository:

```bash
git clone https://github.com/Mireli5656/GitHub-Profile-Analyzer.git
```

Enter the project directory:

```bash
cd GitHub-Profile-Analyzer
```

Open `index.html` in your browser, or use a local development server.

> An internet connection is required to retrieve data from the GitHub REST API.

## 📦 Release

Current version: **v1.1.1**

See the [Releases](https://github.com/Mireli5656/GitHub-Profile-Analyzer/releases) page for version history.

## 🤝 Contributing

Contributions, suggestions, and bug reports are welcome.

1. Fork this repository.
2. Create a new branch.
3. Make your changes.
4. Submit a pull request.

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

Made with ❤️ by [Mireli5656](https://github.com/Mireli5656)
