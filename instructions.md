# instructions 
( asuuming we're working on macos )

### Download my repo
- go to https://github.com/sglowa/alumni-project-scraper
- click green button CODE and from dropdown select Download ZIP
- move the zip to some convenient folder and unpack 

### Open terminal
- in Spotlight type in terminal and open 
- in terminal type in 
    cd
  hit spacebar and then drag and drop unzipped folder with the repository into terminal, so that you end up with something like
    cd /Users/mac/Documents/coding_stuff/linkedin_scraper_new/linkedin_scraper
  press enter
  (cd means change directory, it sets the terminal 'in' the folder where the program is)

### node
- check if you have node
  - in terminal type 
  node --version
- you probably don't (ie if the terminal prints 'command not found' that means you dont), so download and install Node from https://nodejs.org/en
- after your done, go to terminal and type in 
    node --version 
  again to confirm it installed

### python
- check if you have python (anything abover or equal version 3.10 should work)
  in terminal type 
    python3 --version
- if you do, then check if you have pip
  in terminal type
    pip --version 
- if you dont, go to https://www.python.org/downloads/ and download python
- once done, go to terminal and type in 
    python3 --version
    pip3 --version 
  to confirm they installed 

### installing the repository
- now, in terminal, type in
    npm run init
- terminal will print some things but if at the end you see a message saying 'Dependencies installed successfully.' thats good 👍

### tampermonkey
this is the chrome extension we need 
- install tampermonkey chrome extension : https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo
- then in the extensions dropdown menu, click Tampermonkey, and in the popup click dashboard
- in the dashboard click the plus sign (next to installed user scripts)
- you'll be shown a code editor. drag and drop file browserScript.js (found in the repository folder you downloaded and unzipped) into the editor
- save
- still in tampermonkey dashboard, go to 'installed userscripts' tab and make sure the toggle in the 'send post req form linkedin' line of the list is on (green and to toggled to the right)
- go to some random linkedin account; if you see a window with text inputs at the top of the page, eveything worked

### Filling in config settings

- in the repository folder you'll see _.env file
- duplicate it, and open in text editor

there are some settings here that need to be edited 

##### LINKEDIN credentials
provide linkedin credentials
- set up a fake linked in account, login and go through config steps
- add account login and pass to duplicated _.env file that you're editing

log out and back into your new linkedin accout couple of times.

##### PYTHON_PATH
leaving it blank the way it is should be 👍
(if not then absolute path to python needs to be pasted there)

#### PORT_EXPRESS_SERVER
The PORT setting is set to 3212 by default, this should work without eny edits.

##### JOB settings
the NO_OF_JOBS_AFTER_MA and NO_OF_JOBS_BEFORE_MA are self-explanatory, i set the NO_OF_JOBS_BEFORE_MA to 2, because many students in archival studies list in their experience also the internship they do as part of their program 

the EACH_POSITION_AS_JOB should stay set to 1. this is for consistency with how Michal arranged his table

### 
After you're done editing the copy of _.env file you have to rename it to .env (empty before the dot)

some newer OS won't allow you to do through finder so you'll have to do it through terminal

in terminal type (make sure terminal is in the project folder)
    mv ./_.env\ copy ./.env

1. mv is the 'move' command 
2. the next part is the name of the file you want to move. This is the duplicated and edited file - it's name might be different from _.env copy. If so - put there the appropriate filename but remember that spaces in the filename need to be preceded by \ (backward slash). alternatively you can also wrap the filename in double quotes (so "_.env copy")
3. the third part is the destination filename - this should be (we want the file to be named .env )

by default you won't be able to see the new file in finder, cause dot-files are hidden. To reveal them, in finder press cmd+shift+.

### RUN ❗
now we can run the scraping server
- in the terminal type in 
    npm run start
- if the server starts up ok, the terminal should print 'receiving message { initSuccess: true }'
- now you can go to linkedin profile pages and start extracting the data
(for instructions on what does what in the browser window watch enclosed video)

If afer typing 'npm run start' the terminal throws an error message, try logging in and out of your new linkedin account couple more times (and if that doesn't work let me know and send me the error message)

### something to monitor and edit JSON 
this is not strictly necessary but useful for monitoring and adjusting real time what data is being scraped 

- download and install VS CODE https://code.visualstudio.com/download , and open it
- in the left sidepanel go to Extensions, and install 'JSON Table Editor' extension 
- after you scraped first linkedin profile, in the folder of the program (the one you downloaded and unzipped) there should now be a file named alumni_db.json. drag and drop this file into VS CODE. 
- right click on the tab with the file (i mean this segment at the top of the window where the filename is) and select 'Reopen Editor With...' option. Select JSON Table Editor
- now you can see how entries are added as you go through the profile. you can also adjust cell values if something is off. BUT IF YOU DO REMEMEBER TO SAVE THE FILE IN VS-CODE BEFORE SCRAPING THE NEXT PROFILE (if you dont then the changes will be overwriting eachother....)

### convert JSON to CSV
AFTER YOU'RE DONW, to convert the .json file to csv
- go to https://data.page/json/csv
- paste the alumni_db.json file and export as csv
- csv can then be imported to google sheets (or whatever)



