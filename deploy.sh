python3 freeze.py 

cd build

git add *

git commit -m 'deploy'

git push git@github.com:passaglia/tokyo-dying-alone.git main:gh-pages

cd ..

