---
layout: page
title: Hello World!
---
{% include JB/setup %}


## Welcome to my blog, and creative outlet.

    
## Posts so far

<ul class="posts">
  {% for post in site.posts %}
    <li><span>{{ post.date | date_to_string }}</span> &raquo; <a href="{{ BASE_PATH }}{{ post.url }}">{{ post.title }}</a></li>
  {% endfor %}
</ul>

## To-Do

This blog is still unfinished. I've only just set it up and will have to get to grips with Jekyll before I am able to fluently output posts. 

