﻿/**
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
        buckets: null,
        item_index: 0,
        duration: 4000,
        pause: 10
    };

    $.fn.vertMiddle = function () {

        return this.each(function () {
            var $self = this;
            var $self = $(this);
            if (!$self.children().eq(0).is('span')) $self.wrapInner('<span></span>');
            var $span = $self.children().eq(0);
            $span.css('position', 'relative');
            var height = parseInt($span.outerHeight());
            var wrapper = parseInt($self.height());
            var top = parseInt((wrapper - height) / 2);
            $span.css('top', top);
        });

    };

    $.fn.crossroads = function (options) {

        var self = this;
        var $self = $(this);

        if ('string' == typeof (options)) {
            switch (options) {
                case 'destroy':
                    if (!$self.is(':hidden')) $self.empty().hide();
                    if ('undefined' != typeof (crossroads_interval)) {
                        clearInterval(crossroads_interval);
                        interval = null;
                    }
                    break;
            };
            return;
        };

        var opts = $.extend({}, defaults, options);
        $self.empty().fadeIn('slow');

        var $header = $('<div class="sidebar"><div class="header"></div></div>').appendTo($self);
        if ('string' == typeof (opts.title) && opts.title.length) $('<div class="title">' + opts.title + '</div>').appendTo($header);

        var $wrapper = $('<div class="wrapper"></div>').appendTo($self);
        var $table = $('<table class="content"><tbody><tr></tr></tbody></table>').appendTo($wrapper);
        var $row = $table.find('tr').eq(0);

        var project_id = function (url) {
            var id = parseInt(url.substr(url.lastIndexOf('/') + 1));
            return id;
        };

        var set_data = function (id, callback) {
            opts.item_index = 0;
            var url = 'https://crossroads.oxy.edu/srv/projects/' + id + '/buckets.json?page=1&itemsPerPage=all&sortBy=sequence&sortOrder=asc';
            console.log(url);
            $.getJSON(url, function (buckets) {
                opts.buckets = buckets.list;
                callback();
            });
        };

        var get_props = function (item) {
            var props = {};
            props.type = item.resource.resource_type;
            props.address = (null !== item.resource.address && item.resource.address.length) ? item.resource.address : null;
            if ('quote' == item.resource.resource_type) {
                props.title = item.title;
                props.credit = item.credit;
            } else if ('image' == item.resource.resource_type) {
                props.title = item.title;
                props.credit = item.credit;
                props.url = opts.base_url + item.resource.img_original.substr(0, item.resource.img_original.indexOf('?'));
                props.thumb = opts.base_url + item.resource.img_thumb.substr(0, item.resource.img_thumb.indexOf('?'));
            } else if ('video' == item.resource.resource_type) {

            } else if ('audio' == item.resource.resource_type) {

            } else if ('link' == item.resource.resource_type) {

            } else if ('document' == item.resource.resource_type) {

            } else if ('data' == item.resource.resource_type) {
                if (resource.img_original && resource.img_original.length) {
                    props.title = item.title;
                    props.credit = item.credit;
                    props.url = opts.base_url + item.resource.img_original.substr(0, item.resource.img_original.indexOf('?'));
                    props.thumb = opts.base_url + item.resource.img_thumb.substr(0, item.resource.img_thumb.indexOf('?'));
                    props.type = 'image';
                } else {
                    props.title = item.title;
                    props.credit = item.credit;
                    props.type = 'quote';
                };
            } else if ('assertion' == item.resource.resource_type) {
                props.title = item.title;
                props.credit = item.credit;
            } else if ('dispatch' == item.resource.resource_type) {
                if (item.resource.img_original && item.resource.img_original.length) {
                    props.title = item.title;
                    props.credit = item.credit;
                    props.url = opts.base_url + item.resource.img_original.substr(0, item.resource.img_original.indexOf('?'));
                    props.thumb = opts.base_url + item.resource.img_thumb.substr(0, item.resource.img_thumb.indexOf('?'));
                    props.type = 'image';
                } else {
                    props.title = item.title;
                    props.credit = item.credit;
                };
            };
            props.title = props.title.replace(/\*/g, '');  // Crossroads' brand of italics
            props.contributor = item.resource.Owner.name;
            return props;
        };

        var center = function (index, anim) {
            if ($self.is(':hidden')) return;
            if ('undefined' == typeof (index) || null == index) index = opts.item_index;
            if (index > $row.children().length - 1) {
                window.postMessage('autonavigate_finished', '*');
                return;
            };
            if ('undefined' == typeof (anim)) anim = true;
            // Clone the table so that we can find a centered position based on all elements being zoomed except the one to be centered
            $self.find('.wrapper').eq(0).clone().addClass('clone').appendTo($self.find('.wrapper').eq(0).parent()).show();
            var $clone = $self.find('.wrapper.clone');
            $clone.find('td').children().css({
                zoom: '30%'
            });
            var $el = $clone.find('tr').eq(0).children(':eq(' + index + ')').eq(0);
            $el.children('div').css({
                zoom: '100%',
            });
            var $table = $el.closest('table');
            var current_x = parseInt($table.css('left'));
            var position = parseInt($el.position().left);
            var width = parseInt($el.outerWidth(true));
            var browser_width = parseInt($(window).width());
            var x = (position * -1) + (browser_width / 2) - (width / 2);
            $clone.remove();
            // Center the intended node after removing the cloned resources
            $table = $self.find('table').eq(0);
            $el = $table.find('tr').eq(0).children(':eq(' + index + ')').eq(0);
            if (!anim) {
                $table.find('td.current').removeClass('current').children('div').css({
                    zoom : '30%'
                });
                $table.css('left', x);
                $el.addClass('current').children('div').css({
                    zoom : '100%'
                });
                reset_timer();
            } else {
                $table.find('td.current').removeClass('current').children('div').animate({
                    zoom: '30%'
                }, opts.duration);
                $el.addClass('current').children('div').animate({
                    zoom: '100%'
                }, opts.duration);
                $table.animate({
                    left: x
                }, opts.duration, function () {
                    reset_timer();
                });
            };
            index++;
            opts.item_index = index;
        }

        var reset_timer = function (start) {
            if ('undefined' != typeof(crossroads_interval)) {
                clearInterval(crossroads_interval);
                interval = null;
            }
            crossroads_start = opts.pause;  // Global
            crossroads_interval = setInterval(function () {  // Global
                crossroads_start--;
                if (!crossroads_start) {
                    clearInterval(crossroads_interval);
                    crossroads_interval = null;
                    center();
                    return;
                };
            }, 1000);
        }

        set_data(project_id(opts.url), function () {
            // Title page
            var $cell = $('<td class="title_card"><div><div class="inner"></div></div><div class="mast"></div></td>').appendTo($row);
            $cell.find('.inner').html('<h4>International Programs Office Dispatch Contest</h4>');
            $cell.find('.inner').append('<h6>Question</h6>');
            $cell.find('.inner').append('<p>Nicaraguan migration into Costa Rica as well as local high poverty rates has created demand for social work and community centers.</p>');
            $cell.find('.inner').append('<h6>Author</h6>');
            $cell.find('.inner').append('<p>Ciara Byrne</p>');
            // Buckets
            for (var j = 0; j < opts.buckets.length; j++) {
                var $cell = $('<td class="bucket"><div><div class="inner"><span>' + opts.buckets[j].label + '</span></div></div><div class="mast"></div></td>').appendTo($row);
                for (var k = 0; k < opts.buckets[j].bucket_resources.length; k++) {
                    var props = get_props(opts.buckets[j].bucket_resources[k]);
                    console.log(props);
                    var $cell = $('<td class="' + props.type + '"><div><div class="inner"></div></div><div class="mast"></div></td>').appendTo($row);
                    $cell.data('bucket', opts.buckets[j]);
                    $cell.data('resource', opts.buckets[j].bucket_resources[k])
                    $cell.data('props', props);
                    var $inside = $cell.find('.inner');
                    var $mast = $cell.find('.mast');
                    switch (props.type) {
                        case 'image':
                            $inside.append('<img src="' + props.url + '" />');
                            $mast.append('<div class="title">' + props.title + '</div>');
                            if (null !== props.credit && props.credit) $mast.append('<div class="credit">' + props.credit + '</div>');
                            if (null !== props.address && props.address) $mast.append('<div class="address">' + props.address + '</div>');
                            break;
                        case 'quote':
                            props.content = '&ldquo;' + props.title + '&rdquo;';
                            props.content += ' <span class="by">&mdash;&nbsp;' + props.credit + '</span>';
                            $inside.html('<span>' + props.content + '</span>');
                            break;
                        case 'dispatch':
                            props.content += ' <span class="by">&mdash;&nbsp;' + props.title + '</span>';
                            $inside.html('<span>' + props.content + '</span>');
                        case 'link':
                        case 'assertion':
                            $inside.html('<span>' + props.title + '</span>');
                            break;
                    };
                };
            };
            $row.find('.bucket > div > div, .quote > div > div, .assertion > div > div').textfill();
            $row.find('.title_card > div > div, .bucket > div > div').vertMiddle();
            $row.find('td').children('div').css({
                zoom: '30%'
            });
            center(0, false);
            $table.animate({
                'opacity': 1
            });
        });

    };

}(jQuery));