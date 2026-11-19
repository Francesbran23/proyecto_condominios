# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Running the app with MySQL

1. Start MySQL and import `database/bureau-manager.sql` if the `bureau-manager` schema has not been created yet.
2. For an existing database created from the original SQL dump, apply `database/migrations/001_add_receipt_number.sql`, `database/migrations/002_migrate_relationships_and_receipt_date.sql`, `database/migrations/003_prevent_duplicate_tenants.sql`, `database/migrations/004_allow_unassigned_tenants.sql`, `database/migrations/005_add_receipt_payment_status.sql`, and `database/migrations/006_add_password_reset.sql` once each. The second migration moves the tenant-to-department relationship and preserves existing receipt dates. Before applying the third migration, resolve any existing duplicate tenants with the same name, surnames, email, and department. The fourth migration allows an inquilino's department assignment to be released without deleting the inquilino or their receipts. The fifth migration adds payment status and marks existing receipts as pending by default. The sixth migration prepares account passwords for secure hashing and creates the one-time password-reset token table. Existing plaintext passwords continue working and are upgraded to hashes after a successful login.
3. Copy `back/.env.example` to `back/.env` and set `DB_PASSWORD` to your local MySQL password. Keep `back/.env` private; it is excluded from Git.
4. To enable receipt emails and password-reset links with Gmail, set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER` to the sending Gmail address, `SMTP_PASSWORD` to a Google App Password, and optionally `SMTP_FROM` in `back/.env`. `FRONTEND_URL` should be the URL where the React app is available (default `http://localhost:3000`). A normal Gmail account password will not work; enable 2-Step Verification and create an App Password in the Google Account security settings. Never share or commit the app password.
5. In one terminal, run `npm start` from `back/` to start the API on port 4001, which is the port used by the React client.
6. In another terminal, run `npm start` from the project root to start React on port 3000.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
