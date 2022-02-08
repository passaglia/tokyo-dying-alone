import pandas as pd
import numpy as np

def generate_simulated_data(age_df, time_df):

    assert (sum(time_df.sum(axis=0)[1:]) == sum(age_df.sum(axis=0)[1:]))
    total_number_of_people = int(sum(time_df.sum(axis=0)[1:]))
    output_columns = ['gender', 'household', 'age', 'time']
    arr = np.zeros((total_number_of_people, len(output_columns)), dtype=object)
    index_pointer = 0
    for i in range(len(age_df)):
        age = age_df['age'][i]
        for j in range(len(age_df.columns)):
            column_name = age_df.columns[j]
            if column_name=='age':
                pass
            else:
                gender = column_name.split('_')[0]
                household = column_name.split('_')[1]
                multiplicity = int(age_df.loc[i, column_name])
                subarr = np.full((multiplicity ,4),[age, gender, household , 0])
                arr[index_pointer:index_pointer+multiplicity] = subarr
                index_pointer += multiplicity

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
                while multiplicity>0:
                    for ind in empty_inds:
                        if (arr[ind,1] == gender) & (arr[ind,2]==household):
                            arr[ind,3] = time
                            multiplicity-=1
                            empty_inds.remove(ind)
                            break

    df =  pd.DataFrame(arr, columns=["age", "gender", "household", "time"])

    # df['gender']=df['gender'].replace('women', 'w').replace('men','m')
    # df['household']=df['household'].replace('single', 's').replace('multi','m')

    return  df

def preclean_age(df):
    df = df.rename(
        columns={0: 'age', 1: 'total', 2:'men_single', 3:'men_multi',
        4:'men_total', 5:'women_single', 6:'women_multi', 7: 'women_total'})
    
    df = df.replace('-',0)

    for column in ["total",'men_single','men_multi','men_total', 'women_single','women_multi', 'women_total']:
        df[column] =  pd.to_numeric(df[column])

    return df

def preclean_time(df):
    df = df.rename(
        columns={0: 'time', 1: 'total', 2:'men_single', 3:'men_multi',
        4:'men_total', 5:'women_single', 6:'women_multi', 7: 'women_total'})
    
    df = df.replace('-',0)

    for column in ["total",'men_single','men_multi','men_total', 'women_single','women_multi', 'women_total']:
        df[column] =  pd.to_numeric(df[column]) 

    return df

def H28_preclean_age(df): return df
def H28_preclean_time(df): return df

def H22_preclean_age(df):
    df = df.rename(
        columns={0: 'age', 1: 'total', 2:'men_single', 3:'men_multi',
        4:'men_total', 5:'women_single', 6:'women_multi', 7: 'women_total'})
    
    encoding_dict = {"cid:16089":"0", "(cid:16092)": "0", "(cid:16093)": "1","(cid:16094)": "2", "(cid:16095)": "3","(cid:16096)":"4", "(cid:16097)": "5","(cid:16098)": "6","(cid:16099)": "7","(cid:16100)": "8",
    "(cid:16101)": "9", "(cid:7763)(cid:16076)": "歳", "(cid:18522)":"~","(cid:18444)":"0", "(cid:18445)":"1","(cid:18446)":"2","(cid:18447)":"3","(cid:18448)":"4","(cid:18449)":"5","(cid:18450)":"6","(cid:18451)":"7","(cid:18452)":"8","(cid:18453)":"9", "(cid:7763)(cid:7053)(cid:8246)(cid:16076)": "歳未満","(cid:7763)(cid:3048)(cid:2902)(cid:16076)":"歳以上",'(cid:10610)(cid:18103)(cid:18103)(cid:18103)(cid:6744)': "all"}
    for column in ["age","total",'men_single','men_multi','men_total', 'women_single','women_multi', 'women_total']:
        for i in range(len(df["age"])):
            for key in encoding_dict:
                df[column][i] = df[column][i].replace(key, encoding_dict[key])
        df[column] = df[column].str.replace('(', '').str.replace(')', '')
    
    for column in ["total",'men_single','men_multi','men_total', 'women_single','women_multi', 'women_total']:
        df[column] =  pd.to_numeric(df[column])

    return df

def H22_preclean_time(df):
    df = time_df
    df = df.rename(
        columns={0: 'time', 1: 'total', 2:'men_single', 3:'men_multi',
        4:'men_total', 5:'women_single', 6:'women_multi', 7: 'women_total'})
    
    encoding_dict = {"(cid:14984)": "1", "(cid:17214)":"~", "(cid:6371)":"日", "(cid:17136)":"0","(cid:17137)":"1", "(cid:17138)":"2", "(cid:17139)":"3",  "(cid:17140)":"4", "(cid:17141)":"5", "(cid:17142)":"6",  "(cid:17143)":"7", "(cid:17144)":"8","(cid:17145)":"9"}
    for column in ["time","total",'men_single','men_multi','men_total', 'women_single','women_multi', 'women_total']:
        for i in range(len(df["time"])):
            for key in encoding_dict:
                df[column][i] = str(df[column][i]).replace(key, encoding_dict[key])
        #df[column] = df[column].str.replace('(', '').str.replace(')', '')
    
    df = df.replace('-',0)

    for column in ["total",'men_single','men_multi','men_total', 'women_single','women_multi', 'women_total']:
        df[column] =  pd.to_numeric(df[column])

    return df

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

    #replace the japanese age ranges
    df['age'] = df['age'].replace('総数', 'all').replace('総   数', 'all').replace('15歳未満', '<15').replace('85歳以上','>84').str.replace("〜",'-').str.replace("~",'-').str.replace("歳","").str.replace("（再掲）／", "").replace("15以上", ">14").replace("65以上", ">64")

    # check that all the age ranges are self consistent
    dft = df.set_index('age').transpose()
    assert (dft['all'] == dft['<15'] + dft['15-19']+dft['20-24']+dft['25-29']+dft['30-34']+dft['35-39']+
    dft['40-44']+dft['45-49']+dft['50-54']+dft['55-59']+dft['60-64']+dft['65-69']+dft['70-74']+dft['75-79']+dft['80-84']+dft['>84']).all()

    # do more simplifying of the column names
    df = df.rename(columns={'men_total': 'men', 'women_total': 'women'})

    # disgard some rows
    df = df.set_index('age').drop(["all", "0-14", "15-64", ">64", ">14"], axis=0, errors='ignore').reset_index()
    
    # 
    df['age'] = df['age'].replace('<15', '0-14')

    # keep only some columns
    cols_to_keep = ['age', 'men_single', 'women_single', 'men_multi', 'women_multi']
    df = df[cols_to_keep]

    return df

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

def clean_total_deaths(df):

    # fill all the nans with 0
    df = df.fillna(0)
    
    # rename the columns and keep only the relevant ones
    df.columns = df.columns.str.replace("の死亡数", "")
    for i in range(14,31):
        year = 2002 + i - 14
        df.columns = df.columns.str.replace("平成"+str(i)+"年", str(year))
    df["2019"] = pd.to_numeric(df["令和元年"].str.replace(',',''))
    df=df.rename(columns={'区市町村':'ward_jp'})
    cols_to_keep = ['ward_jp']+[str(i) for i in range(2002, 2020)]
    df = df[cols_to_keep]

    # keep only the relevant wards
    df = df.set_index('ward_jp').drop(["総数", "区部", "市部", "郡部", "島部"], axis=0).reset_index()

    # all the remaining wards are in the right order so replace the name by the index+1 to yield the short_code used in the ward json
    for i in range(len(df['ward_jp'])):
        df.loc[i,'ward_jp'] = str(i + 1).zfill(2) 
    df=df.rename(columns={'ward_jp':'short_code'})

    df = df.set_index('short_code')

    return df 

if __name__ == '__main__':

    # read the original data for each ward
    wards = [str(i+1).zfill(2) for i in range(23)]
    years = ['H'+str(i) for i in range(15,31)] + ['R1']
    yearsToWestern = dict([('H'+str(i), str(i + 1988)) for i in range(15,31)] )
    yearsToWestern['R1'] ='2019'
    precleanagefunctions = dict([(year, preclean_age) for year in years])
    precleanagefunctions.update({'H20': H22_preclean_age, 'H21': H22_preclean_age, 'H22': H22_preclean_age,'H28':H28_preclean_age})
    precleantimefunctions = dict([(year, preclean_time) for year in years])
    precleantimefunctions.update({'H20': H22_preclean_time, 'H21': H22_preclean_time, 'H22': H22_preclean_time,'H28':H28_preclean_time})

    headers = dict([(year, None) for year in years])
    headers['H28'] = 'infer'
    encodings = dict([(year, 'UTF-8') for year in years])
    encodings['H28'] = "shift-jis"

    dataframes = []
    for year in years:
        print(year)
        for ward in wards:
            print(ward)
            if year == 'H28':
                wardlabel = ward
            else:
                wardlabel = str(int(ward)-1)
            
            encoding = encodings[year]; header = headers[year]
            age_df = pd.read_csv('./rawdata/' + year + '/age/' + year + '-age-'+wardlabel+'.csv', encoding=encoding, header=header)
            age_df = precleanagefunctions[year](age_df)

            if year == 'H19' and ward == '06':
                age_df['women_multi'][16] = 9
                age_df['women_total'][0] = 75
                age_df['women_total'][16] = 19
                age_df['total'][0] = 214
                age_df['total'][16] = 27

            age_df = clean_age(age_df)

            time_df = pd.read_csv('./rawdata/' + year + '/time/' + year + '-time-'+wardlabel+'.csv', encoding=encoding, header=header)
            time_df = precleantimefunctions[year](time_df)
            time_df = clean_time(time_df)

            #Fixing data inconcistencies in R1
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

            simulated_data_df = generate_simulated_data(age_df, time_df)
            simulated_data_df['ward'] = ward
            simulated_data_df['year'] = yearsToWestern[year]
            dataframes.append(simulated_data_df)
        
    #combine all the ward data into a 3D dataframe    
    all_wards_all_years = pd.concat(dataframes, axis=0, ignore_index=True)
    all_wards_all_years.to_json('data/alone/deaths_alone.json.gz',compression='gzip')

    # # read the total deaths data
    df = pd.read_csv('./rawdata/shibou.csv', encoding="UTF-8")
    cleaned_total = clean_total_deaths(df)
    cleaned_total.to_json('data/total/shibou.json')


# import os
# import numpy as np
# def rename_files(folder, prefactor):

#     list_of_files = os.listdir(folder)
#     list_to_sort_on = [int(x.split("-")[3][-1] + '0' + x.split("-")[5] +x.split("-")[-1].split('.')[0]) for x in list_of_files]
#     sorting_inds = np.argsort(list_to_sort_on)
#     list_of_files_sorted = [list_of_files[ind] for ind in sorting_inds]
#     for i in range(len(list_of_files_sorted)):
#         print(i)
#         os.rename(list_of_files_sorted[i], prefactor+str(i)+'.csv')