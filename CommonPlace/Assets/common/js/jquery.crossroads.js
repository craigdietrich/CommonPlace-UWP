/**
 * Display Global Crossroads content on a single screen
 * @author  Craig Dietrich
 * @requires jquery.textfill.min.js
 */
(function ($) {

    var defaults = {
        base_url: 'https://crossroads.oxy.edu',
        title: null,
        authors: null,
        url: null,
        resources: null,
        resource_index: 0,
        interval: null,
        duration: 4000,
        pause: 10
    };

    $.fn.crossroads = function (options) {

        var self = this;
        var $self = $(this);

        if ('string' == typeof (options)) {
            switch (options) {
                case 'destroy':
                    if (!$self.is(':hidden')) {
                        $self.fadeOut('slow', function () {
                            $self.empty();
                        });
                    };
                    break;
            };
            return;
        };

        var opts = $.extend({}, defaults, options);
        $self.empty().fadeIn('slow');

        var $gradient = $('<div class="gradient"></div>').appendTo($self);

        var $header = $('<div class="header"><div class="mast">Global<br />Crossroads</div></div>').appendTo($self);
        if ('string' == typeof (opts.title) && opts.title.length) $('<div class="title">'+opts.title+((null!==opts.authors)?'<br /><span class="authors">by '+opts.authors+'</span>':'')+'</div>').appendTo($header);
        $header.append('<hr />');

        var $bucket = $('<div class="bucket"></div>').appendTo($self);

        var $table = $('<table class="content"><tbody><tr></tr></tbody></table>').appendTo($self);
        var $row = $table.find('tr').eq(0);

        var project_id = function (url) {
            var id = parseInt(url.substr(url.lastIndexOf('/') + 1));
            return id;
        };

        var get_data = function (id, callback) {
            var url = 'https://crossroads.oxy.edu/srv/projects/' + id + '/buckets.json?page=1&itemsPerPage=all&sortBy=sequence&sortOrder=asc';
            $.getJSON(url, function (buckets) {
                url = 'https://crossroads.oxy.edu/srv/projects/' + id + '/resources.json?page=1&itemsPerPage=all&sortBy=sequence&sortOrder=asc';
                $.getJSON(url, function (json) {
                    opts.resources = json.list;
                    for (var j = 0; j < opts.resources.length; j++) {
                        for (var k = 0; k < buckets.list.length; k++) {
                            for (var m = 0; m < buckets.list[k].bucket_resources.length; m++) {
                                if (buckets.list[k].bucket_resources[m].resource_id != opts.resources[j].resource_id) continue;
                                opts.resources[j].bucket = buckets.list[k];
                            };
                        };
                    };
                    callback();
                });
            });
        };

        var get_props = function (resource, bucket) {
            var props = {};
            props.type = resource.resource_type;
            props.bucket = ('undefined' == typeof(bucket) || !bucket) ? null : bucket;
            if ('quote' == resource.resource_type) {
                props.title = resource.credit;
                props.content = resource.excerpt;
                props.source = resource.source_url;
            } else if ('image' == resource.resource_type) {
                props.title = resource.excerpt;
                props.url = base_url + resource.img_original.substr(0, resource.img_original.indexOf('?'));
                props.thumb = base_url + resource.img_thumb.substr(0, resource.img_thumb.indexOf('?'));
                props.source = resource.credit;
                props.sourceLocation = resource.source_url;
            } else if ('video' == resource.resource_type) {
                props.title = resource.excerpt;
                props.url = resource.source_url;
                props.source = resource.credit;
            } else if ('audio' == resource.resource_type) {
                props.title = resource.excerpt;
                props.url = resource.source_url;
                props.source = resource.credit;
            } else if ('link' == resource.resource_type) {
                props.title = resource.excerpt;
                props.url = resource.source_url;
                props.source = resource.credit;
            } else if ('document' == resource.resource_type) {
                props.title = resource.excerpt;
                props.url = opts.base_url + resource.doc_path.substr(0, resource.doc_path.indexOf('?'));
                props.source = resource.credit;
                props.sourceLocation = resource.source_url;
            } else if ('data' == resource.resource_type) {
                if (resource.img_original && resource.img_original.length) {
                    props.title = resource.excerpt;
                    props.url = opts.base_url + resource.img_original.substr(0, resource.img_original.indexOf('?'));
                    props.thumb = opts.base_url + resource.img_thumb.substr(0, resource.img_thumb.indexOf('?'));
                    props.source = resource.credit;
                    props.sourceLocation = resource.source_url;
                    props.type = 'image';
                } else {
                    props.title = resource.credit;
                    props.content = resource.excerpt;
                    props.source = resource.source_url;
                    props.type = 'quote';
                };
            } else if ('assertion' == resource.resource_type) {
                props.title = resource.credit;
                props.content = resource.excerpt;
                props.source = resource.source_url;
            } else if ('dispatch' == resource.resource_type) {
                if (resource.img_original && resource.img_original.length) {
                    props.title = resource.excerpt;
                    props.url = opts.base_url + resource.img_original.substr(0, resource.img_original.indexOf('?'));
                    props.thumb = opts.base_url + resource.img_thumb.substr(0, resource.img_thumb.indexOf('?'));
                    props.source = resource.credit;
                    props.sourceLocation = opts.base_url + resource.source_url;
                    props.type = 'image';
                } else {
                    props.title = resource.credit;
                    props.content = resource.excerpt;
                    props.source = resource.source_url;
                    props.type = 'dispatch';
                };
            };
            props.title = props.title.replace(/\*/g, '');  // Crossroads' brand of italics
            props.contributor = resource.Owner.name;
            return props;
        };

        var bucket = function (props, anim) {
            if ('undefined' == typeof (anim)) anim = true;
            var old_label = $bucket.html();
            var label = (null == props.bucket || null == props.bucket.label) ? '' : props.bucket.label;
            if (old_label != label) {
                if (!anim) {
                    $bucket.html(label).fadeIn('slow');
                } else {
                    $bucket.fadeOut(opts.duration / 2, function () {
                        $(this).html(label).fadeIn(opts.duration / 2);
                    });
                };
            };
        };

        var center = function (index, anim) {
            if ('undefined' == typeof (index)) index = opts.resource_index;
            if (index > opts.resources.length - 1) {
                console.log('done!');
                window.postMessage('autonavigate_finished', '*');
                return;
            };
            if ('undefined' == typeof (anim)) anim = true;
            var $el = $row.children(':eq(' + index + ')').eq(0);
            var $table = $el.closest('table');
            var current_x = parseInt($table.css('left'));
            var position = parseInt($el.position().left);
            var width = parseInt($el.outerWidth());
            var browser_width = parseInt($(window).width());
            var x = (position * -1) + (browser_width / 2) - (width / 2);
            if (!anim) {
                $table.css('left', x);
                reset_timer();
            } else {
                $table.animate({
                    left: x
                }, opts.duration, function () {
                    reset_timer();
                });
            };
            bucket($el.data('props'), ((!index)?false:true));
            index++;
            opts.resource_index = index;
        }

        var reset_timer = function (start) {
            if (null !== opts.interval) {
                clearInterval(opts.interval);
                interval = null;
            }
            if ('undefined' == typeof (start)) start = opts.pause;
            opts.interval = setInterval(function () {
                start--;
                if (!start) {
                    clearInterval(opts.interval);
                    opts.interval = null;
                    center();
                    return;
                };
            }, 1000);
        }

        get_data(project_id(opts.url), function () {
            for (var j = 0; j < opts.resources.length; j++) {
                var props = get_props(opts.resources[j].resource, opts.resources[j].bucket);
                var $cell = $('<td class="' + props.type + '"><div><div class="inner"></div></div><div class="below"></div></td>').appendTo($row);
                $cell.data('props', props);
                console.log(props);
                var $inside = $cell.find('.inner');
                var $below = $cell.find('.below');
                switch (props.type) {
                    case 'image':
                        $inside.append('<img src="' + props.url + '" />');
                        $below.html(props.title);
                        break;
                    case 'quote':
                        props.content = '&ldquo;' + props.content + '&rdquo;';
                        props.content += ' <span class="by">&mdash;&nbsp;' + props.title + '</span>';
                        $inside.html('<span>' + props.content + '</span>');
                        break;
                    case 'dispatch':
                        props.content += ' <span class="by">&mdash;&nbsp;' + props.title + '</span>';
                        $inside.html('<span>' + props.content + '</span>');
                    case 'link':
                    case 'assertion':
                        $inside.html('<span>'+props.content+'</span>');
                        break;
                };
            };
            $row.find('.quote > div > div').textfill({

            });
            center(0, false);
            $table.animate({
                'opacity': 1
            });
        });

    };

}(jQuery));