---
layout: post
title: "How to safely enter passwords in a terminal"
date: 2013-08-02 00:23:44 +0200
categories: programming shell
---

Sometimes command line programs allow you to pass passwords to switches. For
example, MySQL: `mysql -u user -p password`. However, if your shell records
history, you're risking to store your password in a plain text file. There's a
way to avoid this. Depending on your shell add the following line.

### Zsh

```sh
# ~/.zshrc
setopt HIST_IGNORE_SPACE
```

### Bash

```
# ~/.bashrc
HISTCONTROL=ignorespace
```

## Result

Now you can prepend a space character before your command. Such a command won't
be stored in your history.

```
% whoami
linuxhacker
%  mysql -u user -p password
% # do your business... exit MySQL
% Bye.
```

Press <kbd>Arrow_Up</kbd>. The MySQL command isn't in your history.

```
% ↑
% whoami
```
