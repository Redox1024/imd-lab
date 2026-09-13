# Publish IMD Lab with GitHub Pages

1. Create a GitHub repository for the website, such as `imd-lab`.
2. Extract the downloaded ZIP. Upload its contents to the repository root, including `dist`, `scripts`, `package.json` and `.github/workflows/pages.yml`. Keep the directory structure intact.
3. In the repository, open **Settings → Pages → Build and deployment** and choose **GitHub Actions** as the source.
4. Open **Actions**, choose **Deploy lab website to GitHub Pages**, and run the workflow if it has not started automatically.
5. Once deployment succeeds, open the website URL shown in **Settings → Pages** or the workflow deployment result.

The address normally follows `https://USERNAME.github.io/REPOSITORY/`. A repository named `USERNAME.github.io` uses the root address. Use the actual address returned by GitHub.

## Upload from a terminal

Run these commands inside the extracted project, substituting your own repository URL:

```bash
git init
git add .
git commit -m "Create IMD Lab website"
git branch -M main
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git push -u origin main
```

If your file browser hides dot-prefixed folders, ensure `.github` is included. Upload the project contents rather than placing them inside an extra folder.

## Update the website

Open the site’s **Edit content**, make changes, and choose **Preview → Download JSON**. On GitHub, replace `dist/data/content.json` with that file and commit. The workflow validates the content and publishes the updated site.

Enter the actual repository URL in **Lab settings → Website GitHub repository** to enable the editor’s **Open GitHub** shortcut. This opens the upload page; it does not upload or commit automatically.

For image updates, add the image to `dist/assets` and update its path in the editor. Replace all example identities, records and contact details before using the website as your official lab page.
