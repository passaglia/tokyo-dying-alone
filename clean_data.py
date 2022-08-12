# For each ward and year, this script takes in two .csv files describing the number of deaths by age-bracket and deaths-by-time.
# Outputs a single cumulative compressed csv containing one row per death.
#
# Also takes in a .csv with statistics about total deaths by ward by year in tokyo and outputs it as a json file

import pandas as pd
import numpy as np

# preclean functions bring all csvs to the same format as Heisei 28 (2016)
def H28_preclean_age(df): return df
def H28_preclean_time(df): return df

# Heisei 22 data suffers from an encoding problem which has to be fixed
def H22_preclean_age(df):
    df = df.rename(
        columns={0: 'age', 1: 'total', 2:'men_single', 3:'men_multi',
        4:'men_total', 5:'women_single', 6:'women_multi', 7: 'women_total'})
    
    # list of encodings 
    encoding_dict = {"cid:16089":"0", "(cid:16092)": "0", "(cid:16093)": "1","(cid:16094)": "2", "(cid:16095)": "3","(cid:16096)":"4", "(cid:16097)": "5","(cid:16098)": "6","(cid:16099)": "7","(cid:16100)": "8",
    "(cid:16101)": "9", "(cid:7763)(cid:16076)": "歳", "(cid:18522)":"~","(cid:18444)":"0", "(cid:18445)":"1","(cid:18446)":"2","(cid:18447)":"3","(cid:18448)":"4","(cid:18449)":"5","(cid:18450)":"6","(cid:18451)":"7","(cid:18452)":"8","(cid:18453)":"9", "(cid:7763)(cid:7053)(cid:8246)(cid:16076)": "歳未満","(cid:7763)(cid:3048)(cid:2902)(cid:16076)":"歳以上",'(cid:10610)(cid:18103)(cid:18103)(cid:18103)(cid:6744)': "all"}
    for column in ["age","total",'men_single','men_multi','men_total', 'women_single','women_multi', 'women_total']:
        for i in range(len(df["age"])):
            for key in encoding_dict:
                df[column][i] = df[column][i].replace(key, encoding_dict[key]) # Fix encodings for each row and column of data
        df[column] = df[column].str.replace('(', '').str.replace(')', '')
    
    for column in ["total",'men_single','men_multi','men_total', 'women_single','women_multi', 'women_total']:
        df[column] =  pd.to_numeric(df[column]) # Fixes pandas dtype

    return df

def H22_preclean_time(df):
    df = time_df
    df = df.rename(
        columns={0: 'time', 1: 'total', 2:'men_single', 3:'men_multi',
        4:'men_total', 5:'women_single', 6:'women_multi', 7: 'women_total'})
    
    # list of encodings 
    encoding_dict = {"(cid:14984)": "1", "(cid:17214)":"~", "(cid:6371)":"日", "(cid:17136)":"0","(cid:17137)":"1", "(cid:17138)":"2", "(cid:17139)":"3",  "(cid:17140)":"4", "(cid:17141)":"5", "(cid:17142)":"6",  "(cid:17143)":"7", "(cid:17144)":"8","(cid:17145)":"9"}
    for column in ["time","total",'men_single','men_multi','men_total', 'women_single','women_multi', 'women_total']:
        for i in range(len(df["time"])):
            for key in encoding_dict:
                df[column][i] = str(df[column][i]).replace(key, encoding_dict[key]) # Fix encodings for each row and column of data
    
    df = df.replace('-',0)

    for column in ["total",'men_single','men_multi','men_total', 'women_single','women_multi', 'women_total']:
        df[column] =  pd.to_numeric(df[column]) # Fixes pandas dtype

    return df

# All other years use these preclean functions
def preclean_age(df):
    df = df.rename(
        columns={0: 'age', 1: 'total', 2:'men_single', 3:'men_multi',
        4:'men_total', 5:'women_single', 6:'women_multi', 7: 'women_total'})
    
    df = df.replace('-',0)

    for column in ["total",'men_single','men_multi','men_total', 'women_single','women_multi', 'women_total']:
        df[column] =  pd.to_numeric(df[column]) # Fixes pandas dtype

    return df

def preclean_time(df):
    df = df.rename(
        columns={0: 'time', 1: 'total', 2:'men_single', 3:'men_multi',
        4:'men_total', 5:'women_single', 6:'women_multi', 7: 'women_total'})
    
    df = df.replace('-',0)

    for column in ["total",'men_single','men_multi','men_total', 'women_single','women_multi', 'women_total']:
        df[column] =  pd.to_numeric(df[column])  # Fixes pandas dtype

    return df

# Extracts only the data we need from the age csvs and runs some consistency checks 
def clean_age(df):

    # fill all the nans with 0
    df = df.fillna(0)

    # rename the japanese columns
    df = df.rename(columns={'年齢': 'age', '総数(人)': 'total', 
    '男性／単身世帯(人)':'men_single',  '男性／複数世帯(人)':'men_multi', '男性／小計(人)':'men_total',
    '女性／単身世帯(人)':'women_single', '女性／複数世帯(人)':'women_multi', '女性／小計(人)':'women_total'})

    # tests that the columns are self-consistent
    assert (df["men_total"] == (df["men_single"] + df["men_multi"])).all()
    assert (df["women_total"] == (df["women_single"] + df["women_multi"])).all()
    assert (df["total"] == (df["men_total"] + df["women_total"])).all()

    # replace the japanese age ranges
    df['age'] = df['age'].replace('総数', 'all').replace('総   数', 'all').replace('15歳未満', '<15').replace('85歳以上','>84').str.replace("〜",'-').str.replace("~",'-').str.replace("歳","").str.replace("（再掲）／", "").replace("15以上", ">14").replace("65以上", ">64")

    # check that all the age ranges are self consistent
    dft = df.set_index('age').transpose()
    assert (dft['all'] == dft['<15'] + dft['15-19']+dft['20-24']+dft['25-29']+dft['30-34']+dft['35-39']+
    dft['40-44']+dft['45-49']+dft['50-54']+dft['55-59']+dft['60-64']+dft['65-69']+dft['70-74']+dft['75-79']+dft['80-84']+dft['>84']).all()

    # do more simplifying of the column names
    df = df.rename(columns={'men_total': 'men', 'women_total': 'women'})

    # disgard some rows
    df = df.set_index('age').drop(["all", "0-14", "15-64", ">64", ">14"], axis=0, errors='ignore').reset_index()
    df['age'] = df['age'].replace('<15', '0-14')

    # keep only some columns
    cols_to_keep = ['age', 'men_single', 'women_single', 'men_multi', 'women_multi']
    df = df[cols_to_keep]

    return df

# Extracts only the data we need from the time csvs and runs some consistency checks 
def clean_time(df):

    # fill all the nans with 0
    df = df.fillna(0)

    # rename the japanese columns
    df = df.rename(columns={'死後経過日数': 'time', '総数': 'total', 
    '男性／単身世帯／実数(人)':'men_single',  '男性／複数世帯／実数(人)':'men_multi', '男性／小計／実数(人)':'men_total',
    '女性／単身世帯／実数(人)':'women_single', '女性／複数世帯／実数(人)':'women_multi', '女性／小計／実数(人)':'women_total',
    '総数／構成比(%)': 'total_percent', 
    '男性／単身世帯／構成比(%)':'men_single_percent',  '男性／複数世帯／構成比(%)':'men_multi_percent', '男性／小計／構成比(%)':'men_total_percent',
    '女性／単身世帯／構成比(%)':'women_single_percent', '女性／複数世帯／構成比(%)':'women_multi_percent', '女性／小計／構成比(%)':'women_total_percent'})

    # tests that the columns are self-consistent
    assert (df["men_total"] == (df["men_single"] + df["men_multi"])).all()
    assert (df["women_total"] == (df["women_single"] + df["women_multi"])).all()
    assert (df["total"] == (df["men_total"] + df["women_total"])).all()

    #replace the japanese time ranges
    df['time'] = df['time'].replace('合計', 'all').str.replace('〜', '-').str.replace('~', '-').str.replace('日','').replace("366-", ">365")

    # do more simplifying of the column names
    df = df.rename(columns={'men_total': 'men', 'women_total': 'women'})

    # disgard some rows
    df = df.set_index('time').drop(["all"], axis=0,errors='ignore').reset_index()

    # keep only some columns
    cols_to_keep = ['time', 'men_single', 'women_single', 'men_multi', 'women_multi']
    df = df[cols_to_keep]

    return df

# cleans the total deaths csv
def clean_total_deaths(df):

    # fill all the nans with 0
    df = df.fillna(0)
    
    # rename the columns and keep only the relevant ones
    df.columns = df.columns.str.replace("の死亡数", "")
    for i in range(14,31):
        year = 2002 + i - 14
        df.columns = df.columns.str.replace("平成"+str(i)+"年", str(year))
    # df["2019"] = pd.to_numeric(df["令和元年"].str.replace(',',''))
    df["2019"] = pd.to_numeric(df["令和元年"])
    df["2020"] = pd.to_numeric(df["令和2年"])

    df=df.rename(columns={'区市町村':'ward_jp'})
    cols_to_keep = ['ward_jp']+[str(i) for i in range(2002, 2021)]
    df = df[cols_to_keep]

    # keep only the relevant wards
    df = df.set_index('ward_jp').drop(["総数", "区部", "市部", "郡部", "島部"], axis=0).reset_index()

    # all the remaining wards are in the right order so replace the name by the index+1 to yield the short_code used in the ward json
    for i in range(len(df['ward_jp'])):
        df.loc[i,'ward_jp'] = str(i + 1)
    df=df.rename(columns={'ward_jp':'short_code'})

    df = df.set_index('short_code')

    return df 

# To combine the age and time csvs we generate a csv which has one row per person
# containing ward, year, gender, household, age, time fields
# These are not real people because the age-time dimension is not given in the input csvs
# In the dashboard we will therefore have to ban crossfiltering those dimensions. 
def generate_simulated_data(age_df, time_df):

    # Check that the age and time csvs have consistent data
    assert (sum(time_df.sum(axis=0)[1:]) == sum(age_df.sum(axis=0)[1:]))
    total_number_of_people = int(sum(time_df.sum(axis=0)[1:]))

    # pregenerate the output array (ward and year added later)
    output_columns = ['gender', 'household', 'age', 'time']
    arr = np.zeros((total_number_of_people, len(output_columns)), dtype=object)

    # index pointer that keeps track of what row of the output array we are filling
    index_pointer = 0

    #first go through the age dataframe and fill the output array with this data
    for i in range(len(age_df)):
        age = age_df['age'][i]
        for j in range(len(age_df.columns)):
            column_name = age_df.columns[j]
            if column_name=='age':
                pass #the age column has no data: age info is contained in row number
            else:
                gender = column_name.split('_')[0] # gender of the column becomes gender of the person
                household = column_name.split('_')[1] # same for household 
                multiplicity = int(age_df.loc[i, column_name]) # data in the table becomes number of people with this gender/household/age
                subarr = np.full((multiplicity ,4),[age, gender, household , 0]) # make people
                arr[index_pointer:index_pointer+multiplicity] = subarr # insert people into the output csv at index pointer location
                index_pointer += multiplicity # move index point

    # Now go through time csv to add the time information for each person.
    # Empty inds keeps track of which people have no time information
    empty_inds = [i for i in range(len(arr))]
    for i in range(len(time_df)):
        time = time_df['time'][i]
        for j in range(len(time_df.columns)):
            column_name = time_df.columns[j]
            if column_name=='time':
                pass
            else:
                gender = column_name.split('_')[0]
                household = column_name.split('_')[1]
                multiplicity = int(time_df.loc[i, column_name])
                # for every person with this gender/household/death time,
                # find a person in the outout array with same gender/household and fill in the time
                while multiplicity>0:
                    for ind in empty_inds:
                        if (arr[ind,1] == gender) & (arr[ind,2]==household):
                            arr[ind,3] = time
                            multiplicity-=1
                            empty_inds.remove(ind) #once the time has been filled in remove this person from the list of people with no time info yet
                            break

    # everyone now should have time information
    assert len(empty_inds) == 0 

    # convert array to a dataframe
    df =  pd.DataFrame(arr, columns=["age", "gender", "household", "time"])

    return  df

# shorten entries in the final csv to ease compression
def precompress(df):
    def age_renamer(d):
        if d == '0-14':
            return 10+2
        if d == '>84':
            return 85+2
        return int(d.split('-')[0])+2

    df['age'] = df['age'].map(age_renamer)
    df['gender'] = df['gender'].replace('women','w').replace('men','m')
    df['household'] = df['household'].replace('single','s').replace('multi','m')
    df['year'] = df['year']-2000
    
    return df

if __name__ == '__main__':

    # information about each ward and year and the preclean functions to use on them
    wards = [str(i+1).zfill(2) for i in range(23)]
    years = ['H'+str(i) for i in range(15,31)] + ['R1','R2']
    yearsToWestern = dict([('H'+str(i), i + 1988) for i in range(15,31)] )
    yearsToWestern['R1'] =2019
    yearsToWestern['R2'] = 2020
    precleanagefunctions = dict([(year, preclean_age) for year in years])
    precleanagefunctions.update({'H20': H22_preclean_age, 'H21': H22_preclean_age, 'H22': H22_preclean_age,'H28':H28_preclean_age})
    precleantimefunctions = dict([(year, preclean_time) for year in years])
    precleantimefunctions.update({'H20': H22_preclean_time, 'H21': H22_preclean_time, 'H22': H22_preclean_time,'H28':H28_preclean_time})
    headers = dict([(year, None) for year in years])
    headers['H28'] = 'infer'
    encodings = dict([(year, 'UTF-8') for year in years])
    encodings['H28'] = "shift-jis" # H28 is shift-jis encoded because it is directly from the open data website.

    # go through the csvs and make a list of simulated people for each ward and year
    dataframes = []
    for year in years:
        for ward in wards:
            print("Year ", year, " Ward ", ward)

            #file naming convention is slightly different for H28
            if year == 'H28':
                wardlabel = ward
            else:
                wardlabel = str(int(ward)-1)
            
            #read csvs into dataframe
            encoding = encodings[year]; header = headers[year]
            age_df = pd.read_csv('./data/rawdata/' + year + '/age/' + year + '-age-'+wardlabel+'.csv', encoding=encoding, header=header)
            time_df = pd.read_csv('./data/rawdata/' + year + '/time/' + year + '-time-'+wardlabel+'.csv', encoding=encoding, header=header)

            # preclean each csv
            age_df = precleanagefunctions[year](age_df)
            time_df = precleantimefunctions[year](time_df)

            # in H19 ward 06 age there are some typos which have to be fixed (based on internal consistency)
            if year == 'H19' and ward == '06':
                age_df['women_multi'][16] = 9
                age_df['women_total'][0] = 75
                age_df['women_total'][16] = 19
                age_df['total'][0] = 214
                age_df['total'][16] = 27

            # clean each csv
            age_df = clean_age(age_df)
            time_df = clean_time(time_df)

            # In R1 there are some very small data inconsistencies throughout which cannot be fixed based on internal logic.
            # We make guesses to fix the inconsistencies
            if year == 'R1':
                if ward == '02' or ward == "04" or ward == "12" or ward == "14" or ward == "17" or ward == "19" or ward == "21" or ward == "22" or ward == "23":
                    time_df['men_multi'][0] += 1
                if ward == '10' or ward=='15' or ward=='17' or ward == "18" or ward == "21" or ward == "23":
                    time_df['women_multi'][0] += 1
                if ward == '11' or ward =="20":
                    time_df['men_multi'][0] += 2
                if ward == "12":
                    time_df['women_multi'][0] += 5
                if ward == "19":
                    time_df['women_multi'][0] += 6

            # Simulate the people for each ward/year
            simulated_data_df = generate_simulated_data(age_df, time_df)
            simulated_data_df['ward'] = ward
            simulated_data_df['year'] = yearsToWestern[year]

            # add to the list of simulated people
            dataframes.append(simulated_data_df)
        
    # concatenate the list of simulated people
    all_wards_all_years = pd.concat(dataframes, axis=0, ignore_index=True)
    
    # precompress it
    all_wards_all_years = precompress(all_wards_all_years)

    # output it, compressed
    all_wards_all_years.to_csv('data/alone/deaths_alone.gz', index=False, compression='gzip')
    
    # also read and output the total deaths data
    df = pd.read_csv('./data/rawdata/shibou.csv', encoding="UTF-8")
    cleaned_total = clean_total_deaths(df)
    cleaned_total.to_json('data/total/shibou.json')
