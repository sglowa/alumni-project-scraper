import json
import sys
import os
script_dir = os.path.dirname(os.path.abspath(__file__))
libs_dir = os.path.join(script_dir,'libs')
sys.path.append(libs_dir)
sys.path.append('.')
from libs.linkedin_api import Linkedin

# from stdin {profileId, schoolId} 
# fetch profile
# fetch school
# return to stdout 
# // i think its as simple as that 

def fetchFromApi(type, id):
    if type == "profile":
        fetchedDict = api.get_profile(id)
    elif type == "school":
        fetchedDict = api.get_school(id)            
    elif type == "company":
        fetchedDict = api.get_company(id)
    return fetchedDict            

def initialize(login,password):
    global api
    api = Linkedin(login,password)

def main():
    
    print(json.dumps({'python':'running python process'}),flush=True)
    print(json.dumps({'python':'python version : {}'.format(sys.version)}),flush=True)
    initialize("s9lowacki@gmail.com","2351314")
    print('initSuccess',flush=True)
    profileJSON = fetchFromApi("profile","jannaleguijt")
    print(len(profileJSON["education"]))

main()
