# [SlugSchedule](https://cabalex.github.io/slugschedule)

I didn't realize how bad the course shopping experience was... so here's a way to make it better!

### How it works
Every hour, a GitHub Action will run which sends a request to the class schedule to fetch all the courses in one request. From there, it will detect which courses have changed (whether it be if a course has been created, or seats have been filled/created/vacated), and fetch more details if so. It then recompiles all this data into a new database and pushes that to the server.

### Interested in messing around with the data?
The database is freely exposed in the window with the variable `db`! Open the console with `CTRL + SHIFT + C`, and type `db` to print the database.

### Contributing
To develop in the repository, you must run `npm install --force` in the root directory after cloning. This is because there is a version conflict between the version of Svelte this project currently uses and the ones some of the libraries I use support, but it causes no issues, and can be ignored.

You must also run `npm install` in the `.server` directory.

Then, you can run `npm run dev` in the root directory to start the dev server, or `npm run dev` in the `.server` directory to run the GitHub Action script (for updating the class schedule).

### License
MIT. If you make something cool with my code, feel free to let me know! :)
