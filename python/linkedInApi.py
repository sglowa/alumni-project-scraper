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
    for line in sys.stdin:
        try:
            input_data=json.loads(line)
            command=input_data.get("command","")
            if(command=="start"):
                login = input_data.get("login","")
                password = input_data.get("password","") 
                initialize(login,password)
                print(json.dumps({'initSuccess':bool(api)}))
                sys.stdout.flush()
            elif(command=="fetch"):
                profileId=input_data.get("profileId","")
                schoolIds=input_data.get("schoolIds","")            
                profileJSON = fetchFromApi("profile",profileId)
                # schoolJSON = fetchFromApi("school",schoolId)
                schoolsJSONs = []
                for schoolId in schoolIds:
                    schoolsJSONs.append(fetchFromApi("school",schoolId))
                print(json.dumps({'profileId':profileId,'profileJSON':profileJSON,'schoolsJSONs':schoolsJSONs}))
                sys.stdout.flush()
            elif(command=='test'):
                print(json.dumps({'test':'test received'}))
            elif(command=='exit'):
                    break
        except json.JSONDecodeError:
            print(json.dumps({'error':True,'message':'invalid JSON format'}))
            sys.stdout.flush()

if __name__ == "__main__":
    main()
