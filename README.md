# dandi-notebook-review

This is a web application for managing reviews of DANDI notebooks. It allows users to create, view, and manage reviews of notebooks hosted on GitHub.

The admin user (using ADMIN_TOKEN) can manage users. Each user has a name, email address, and API token. The email address serves as the ID.

Each notebook review is a JSON document that includes
notebook_uri (the uri of the notebook being reviewed on github)
reviewer_email: the email address of the reviewer
review: {status: pending|completed, responses: {question_id: string, response: any}[]}
timestamp_created
timestamp_edited

When the user logs in with their admin API key (which is stored in the browse). Then they see their reviews in a table. They can create a new review by entering the notebook uri (url to notebook on github).

When user clicks on a review, they go to the review page where they see the notebook in an iframe on the right panel, and the review form in the left panel.