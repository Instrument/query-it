{% set user = salt['pillar.get']('project:user') %}
{% set home_dir = salt['pillar.get']('os:home_dir') %}

include:
  - node

primary-user:
  user.present:
    - shell: /bin/bash
    - home: {{ home_dir }}

github.com:
  ssh_known_hosts:
    - present
    - fingerprint: 16:27:ac:a5:76:28:2d:36:63:1b:56:4d:eb:df:a6:48

/etc/sudoers.d/ssh-agent:
  file.managed:
    - source: salt://config/sudo-ssh-agent
    - mode: 440

# Ubuntu
packages:
  pkg.installed:
    - pkgs:
      - git
      - tmux
      - toilet
      - vim-nox
      - htop

stupid-shit:
  pkg.purged:
    - pkgs:
      - landscape-common
  file.absent:
    - names:
      - /etc/update-motd.d/51-cloudguest
      - /etc/update-motd.d/10-help-text

/etc/update-motd.d/zz-project:
  file.managed:
    - user: root
    - mode: 775
    - source: salt://config/motd.sh
    - template: jinja

bash_history-1:
  file.managed:
    - name: {{ home_dir }}/.bash_history
    - user: {{ user }}
    - group: {{ user }}

bash_history-2:
  file.blockreplace:
    - name: {{ home_dir }}/.bash_history
    - prepend_if_not_found: True
    # blockreplace doesn't support source..
    - content: |
        sudo htop
        sudo netstat -lpn | grep 8080
        sudo salt-call --local state.highstate
        tail -f project.log
        tmux a -d

start-queryit-upstart:
  file.managed:
    - name: /etc/init/queryit.conf
    - user: root
    - mode: 644
    - source: salt://config/queryit.conf

start-queryit-script:
  file.managed:
    - name: {{ home_dir }}/queryit-tmux.sh
    - user: {{ user }}
    - mode: 755
    - source: salt://config/queryit-tmux.sh
