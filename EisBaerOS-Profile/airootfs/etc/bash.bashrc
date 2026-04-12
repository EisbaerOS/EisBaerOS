# /etc/bash.bashrc
#
# This file is sourced by all interactive bash shells.

# If not running interactively, don't do anything
[[ $- != *i* ]] && return

# Set a colorful prompt
PS1='[\u@\h \W]\$ '

# Display fastfetch if not disabled
if [[ -f /usr/bin/fastfetch ]] && [[ ! -f ~/.no_fastfetch ]]; then
    fastfetch
fi
