/**
 * Display Global Crossroads content on a single screen
 * @author  Craig Dietrich
 * @requires jquery.textfill.min.js
 * @requires hammer.min.js
 */
(function ($) {

    var defaults = {
        base_url: 'https://crossroads.oxy.edu',
        title: null,
        authors: null,
        url: null,
        buckets: null,
        duration: 4000,
        pause: 10,
        projects: null
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

        var get_projects = function (callback) {
            // Until can find out how to get just one project, get them all ~Craig
            var url = 'https://crossroads.oxy.edu/srv/projects.json?sortBy=created_at&sortOrder=desc&template=minimal_for_list&itemsPerPage=10000&page=1';
            console.log('Getting list of all projects: '+url);
            $.getJSON(url, function (projects) {
                callback(projects.list);
            });
        };

        if ('string' == typeof (options)) {
            switch (options) {
                case 'get_projects':
                    var args = arguments;
                    get_projects(function (projects) {
                        args[1](projects);
                    });
                    break;
            };
            return;
        };

        return this.each(function () {

            var self = this;
            var $self = $(this);

            var opts = $.extend({}, defaults, options);
            $self.empty().fadeIn('slow');

            console.log('Current project URL: ' + opts.url);

            var $header = $('<div class="sidebar"><div class="header"></div></div>').appendTo($self);
            if ('string' == typeof (opts.title) && opts.title.length) $('<div class="title"><div class="justify">&nbsp;</div>' + opts.title + '</div>').appendTo($header);
            $header.mousedown(function () {
                var json = { method: 'coming_soon' };
                window.external.notify(JSON.stringify(json));
            });

            var $wrapper = $('<div class="wrapper"></div>').appendTo($self);
            var $table = $('<table class="content"><tbody><tr></tr></tbody></table>').appendTo($wrapper);
            $table.data('url', opts.url);
            var $row = $table.find('tr').eq(0);

            var project_id = function (url) {
                var id = parseInt(url.substr(url.lastIndexOf('/') + 1));
                return id;
            };

            var set_data = function (id, callback) {
                var url = 'https://crossroads.oxy.edu/srv/projects/' + id + '/buckets.json?page=1&itemsPerPage=all&sortBy=sequence&sortOrder=asc';
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
                    if (item.resource.img_original && item.resource.img_original.length) {
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
                if ('undefined' == typeof (props.title)) return false;
                props.title = props.title.replace(/\*/g, '');  // Crossroads' brand of italics
                props.contributor = item.resource.Owner.name;
                return props;
            };

            var center = function (index, anim) {
                if (!$self) return;
                if ($self.is(':hidden')) return;
                if ('undefined' == typeof (index) || null == index) index = 0;
                console.log('Centering index: ' + index);
                if (index > $row.children().length - 1) {
                    window.postMessage('autonavigate_finished', '*');
                    return;
                };
                if ('undefined' == typeof (anim)) anim = true;
                // Clone the table so that we can find a centered position based on all elements being zoomed except the one to be centered
                $self.find('.wrapper').eq(0).clone().addClass('clone').appendTo($self.find('.wrapper').eq(0).parent()).show();
                var $clone = $self.find('.wrapper.clone');
                $clone.find('td').children().css('zoom', '30%');
                var $el = $clone.find('tr').eq(0).children(':eq(' + index + ')').eq(0);
                $el.children('div').css('zoom', '100%');
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
                    // Hide old
                    $table.find('td.current').find('.mast').hide();
                    $table.find('td.current').prev().css('padding-top', '60px');
                    $table.find('td.current').next().css('padding-top', '60px');
                    $table.find('td.current').removeClass('current').css({
                        'padding-top': '60px'
                    }).children('div').css({
                        zoom: '30%'
                    });
                    // Show new
                    $table.css('left', x);
                    $el.find('.mast').show();
                    $el.addClass('current').css({
                        'padding-top': '0px'
                    }).children('div').css({
                        zoom: '100%'
                    });
                    $el.prev().css('padding-top', '0px');
                    $el.next().css('padding-top', '0px');
                    reset_timer(++index);
                } else {
                    // Hide old
                    $table.find('td.current').find('.mast').fadeOut({ duration: (opts.duration / 4), queue: false });
                    $table.find('td').not($el.prev()).not($el.next()).not($el).animate({
                        'padding-top': '60px'
                    }, { duration: opts.duration, queue: false });
                    $table.find('td.current').removeClass('current').animate({
                        'padding-top': '60px'
                    }, { duration: opts.duration, queue: false }).children('div').animate({
                        zoom: '30%'
                    }, { duration: opts.duration, queue: false });
                    // Show new
                    $el.addClass('current').animate({
                        'padding-top': '0px'
                    }, { duration: opts.duration, queue: false }).children('div').animate({
                        zoom: '100%'
                    }, { duration: opts.duration, queue: false });
                    $el.prev().animate({
                        'padding-top': '0px'
                    }, { duration: opts.duration, queue: false });
                    $el.next().animate({
                        'padding-top': '0px'
                    }, { duration: opts.duration, queue: false });
                    $table.animate({
                        left: x
                    }, {
                        duration: opts.duration,
                        queue: false,
                        complete: function () {
                            $el.find('.mast').fadeIn(opts.duration / 4);
                            reset_timer(++index);
                        }
                    });
                };
            }

            var reset_timer = function (index, is_callback) {
                if ('undefined' == typeof ($table.data('url'))) return;  // Project has been deleted before timer has come back
                if ('undefined' == typeof (is_callback)) is_callback = false;
                console.log('Reset timer - table url: ' + $table.data('url')+' - index: '+index + ' - is_callback: '+is_callback);
                if (is_callback) {
                    center(index);
                    return;
                }
                setTimeout(function () {
                    reset_timer(index, true);
                }, 10000);
            }

            set_data(project_id(opts.url), function () {
                // Title page
                if (null !== opts.projects) {
                    var project = null;
                    for (var j = 0; j < opts.projects.length; j++) {
                        if (parseInt(opts.projects[j].id) != project_id(opts.url)) continue;
                        project = opts.projects[j];
                        break;
                    }
                    if (null != project) {
                        var $cell = $('<td class="title_card"><div><div class="inner"></div></div><div class="mast"></div></td>').appendTo($row);
                        $cell.find('.inner').html('<h4>' + project.title + '</h4>');
                        $cell.find('.inner').append('<h6>Question</h6>');
                        $cell.find('.inner').append('<p>' + project.description + '</p>');
                        $cell.find('.inner').append('<h6>Author</h6>');
                        $cell.find('.inner').append('<p>' + project.Owner.name + '</p>');
                    };
                };
                // Buckets
                for (var j = 0; j < opts.buckets.length; j++) {
                    var $cell = $('<td class="bucket"><div><div class="inner"><span>' + opts.buckets[j].label + '</span></div></div><div class="mast"></div></td>').appendTo($row);
                    for (var k = 0; k < opts.buckets[j].bucket_resources.length; k++) {
                        var props = get_props(opts.buckets[j].bucket_resources[k]);
                        //console.log(props);
                        if (!props) continue;
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
                                //if (null !== props.address && props.address) $mast.append('<div class="address">' + props.address + '</div>');
                                break;
                            case 'quote':
                                props.content = '&ldquo;' + props.title + '&rdquo;';
                                props.content += '<br /><span class="by">' + props.credit + '</span>';
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
                var $blank = $('<td class="blank"><div><div class="inner"></div></div><div class="mast"></div></td>').appendTo($row);
                $row.find('.bucket > div > div, .quote > div > div, .assertion > div > div').textfill();
                $row.find('.title_card > div > div').vertMiddle();
                $row.find('td').css({
                    'padding-top': '60px'
                }).children('div').css({
                    zoom: '30%',
                    });
                $row.find('td').each(function() {
                    var hammertime = new Hammer(this);
                    hammertime.get('pan').set({ direction: Hammer.DIRECTION_HORIZONTAL });
                    hammertime.on('panleft', function (ev) {
                        console.log('pan left');
                        console.log(ev);
                        $cell = ($(ev.target).is('td')) ? $(ev.target) : $(ev.target).closest('td');
                        console.log($cell);
                    });
                });
                //center($row.children().length-1, false);
                center(0, false);
                $table.animate({
                    'opacity': 1
                });
            });

        });

    };

}(jQuery));