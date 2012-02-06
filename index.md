---
layout: page
title: Hello World!
---
{% include JB/setup %}


## Welcome to a creative outlet. (blog) of Christopher de Beer

This is my blog, which runs on the Jekyll blogging engine - I havnt used it before, so I'm hoping for the best. I'll be doing my damn'dest to post regularly about the projects I'm workin on. Both as a means of adding value (I hope) to the thriving Open Source Community as well as providing a critical introspection on my own projects for my own sake.

I look forward to enaging anyone who happens upon this site, and in so doing improving the quality of my own work.

<script src="https://gist.github.com/1752529.js?file=bio.json" type="text/javascript"></script>

You can follow me on twitter at [@christopherdb](http://twitter.com/christopherdb). I'm also on [GitHub](http://github.com/christopherdebeer), on [StackOverflow](http://stackoverflow.com/users/371040/christopher), on [Dribbble](http://dribbble.com/christopherdebeer), &amp; on [FFFFound](http://ffffound.com/home/barumunk/found/).

Regards,
Christopher

    
## Posts so far

<ul class="posts">
  {% for post in site.posts %}
    <li><span>{{ post.date | date_to_string }}</span> &raquo; <a href="{{ BASE_PATH }}{{ post.url }}">{{ post.title }}</a></li>
  {% endfor %}
</ul>

## To-Do

This blog is still unfinished. I've only just set it up and will have to get to grips with Jekyll before I am able to fluently output posts. 

