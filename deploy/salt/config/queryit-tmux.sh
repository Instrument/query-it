cd /vagrant
tmux new-session -d 'node server.js'
tmux new-window -d 'npm run dev'
tmux new-window -d 'cd querysrv; node querysrv.js'
