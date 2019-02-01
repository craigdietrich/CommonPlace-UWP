/**
 * @description Display Global Crossroads content on a single screen
 * @author      craigdietrich.com
 * @requires    jquery.textfill.min.js
 * @requires    hammer.min.js
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
        projects: null,
        timer: null
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
                props.annotation = (null !== item.annotation && item.annotation.length) ? item.annotation : null;
                if ('quote' == item.resource.resource_type) {
                    props.title = item.title;
                    props.credit = item.credit;
                } else if ('image' == item.resource.resource_type) {
                    props.title = item.title;
                    props.credit = item.credit;
                    props.url = opts.base_url + item.resource.img_original.substr(0, item.resource.img_original.indexOf('?'));
                    props.thumb = opts.base_url + item.resource.img_thumb.substr(0, item.resource.img_thumb.indexOf('?'));
                } else if ('video' == item.resource.resource_type) {
                    // TODO
                } else if ('audio' == item.resource.resource_type) {
                    // TODO
                } else if ('link' == item.resource.resource_type) {
                    // TODO
                } else if ('document' == item.resource.resource_type) {
                    // TODO
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

            var center_closest = function () {
                var win_center = parseInt($(window).width()) / 2;
                $table.find('td').each(function(index) {
                    var $this = $(this);
                    var el_center = parseInt($this.offset().left) + (parseInt($this.width()) / 2);
                    if (win_center <= el_center) {
                        center(index);
                        return false;
                    }
                });
            }

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
                // Clone the table so that we can find a centered position based on all elements being zoomed out except the one to be centered
                $self.find('.wrapper').eq(0).clone().addClass('clone').appendTo($self.find('.wrapper').eq(0).parent()).show();
                var $clone = $self.find('.wrapper.clone');
                $clone.find('td').css('padding-top', '5vh').children().css('zoom', '30%').children().css('height', '45vh');
                var $el = $clone.find('tr').eq(0).children(':eq(' + index + ')').eq(0);
                $el.children('div').css('zoom', '98%');
                if ($el.hasClass('bigger')) $el.css('padding-top', '0vh').children('div:first').children('div').css('height', '55vh');
                var $table = $el.closest('table');
                var current_x = parseInt($table.css('left'));
                var position = parseInt($el.position().left);
                var width = parseInt($el.outerWidth(true));
                var browser_width = parseInt($(window).width());
                var x = (position * -1) + (browser_width / 2) - (width / 2);
                $clone.remove();
                // Chris' staggered vert
                var stagger_top_margins = ['10vh', '30vh', '50vh', '70vh', '90vh'];
                var stagger_index = 2;
                // Center the intended node
                $table = $self.find('table').eq(0);
                $el = $table.find('tr').eq(0).children(':eq(' + index + ')').eq(0);
                if (!anim) {
                    // Hide old
                    $table.find('td').find('.mast:visible').hide();
                    $table.find('td').each(function (_index) {
                        $(this).removeClass('current').data('stagger_index', stagger_index).css({
                            'padding-top': '5vh'
                        }).children('div').css({
                            'zoom': '30%',
                            'margin-top': stagger_top_margins[stagger_index]
                        }).children('div:not(.title, .credit, .address)').css({
                            'height': '45vh'
                        });
                        stagger_index = stagger_index + (Math.random() < 0.5 ? -1 : 1);
                        if (stagger_index < 0) stagger_index = stagger_top_margins.length - 1;
                        if (stagger_index > stagger_top_margins.length - 1) stagger_index = 0;
                    });
                    // Show new
                    $table.css('left', x);
                    $el.find('.mast').show();
                    $el.addClass('current').children('div').css({
                        'zoom': '98%',
                        'margin-top': '0vh'
                    });
                    reset_timer(++index);
                } else {
                    // Hide old
                    $table.find('td').find('.mast:visible, .anno:visible').fadeOut({ duration: (opts.duration / 4), queue: false });
                    $table.find('td').not($el).removeClass('current').each(function () {
                        var $this = $(this);
                        var _stagger = stagger_top_margins[$this.data('stagger_index')];
                        $this.animate({
                            'padding-top': '5vh'
                        }, { duration: opts.duration, queue: false }).children('div').animate({
                            'zoom': '30%',
                            'margin-top': _stagger
                        }, { duration: opts.duration, queue: false }).children('div:not(.title, .credit, .address)').animate({
                            'height': '45vh'
                        }, { duration: opts.duration, queue: false });
                    });
                    // Show new
                    $el.addClass('current').children('div').animate({
                        'zoom': '98%',
                        'margin-top': '0vh'
                    }, { duration: opts.duration, queue: false });
                    if ($el.hasClass('bigger')) {
                        $el.animate({
                            'padding-top': '0vh'
                        }, { duration: opts.duration, queue: false }).children('div:first').children('div').animate({
                            'height':'55vh'
                        }, { duration: opts.duration, queue: false });
                    };
                    $table.animate({
                        left: x
                    }, {
                        duration: opts.duration,
                        queue: false,
                        complete: function () {
                            $el.find('.mast, .anno').fadeIn(opts.duration / 4);
                            reset_timer(++index, false, (($el.find('.anno').text().length)?20000:null));
                        }
                    });
                };
            }

            var reset_timer = function (index, is_callback, timeout) {
                if ('undefined' == typeof ($table.data('url'))) return;  // Project has been deleted before timer has come back
                if ('undefined' == typeof (is_callback)) is_callback = false;
                console.log('Reset timer - table url: ' + $table.data('url')+' - index: '+index + ' - is_callback: '+is_callback);
                if (is_callback) {
                    center(index);
                    return;
                }
                if ('undefined' == typeof(timeout) || null == timeout) timeout = 10000;
                opts.timer = setTimeout(function () {
                    reset_timer(index, true);
                }, timeout);
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
                        //$cell.find('.inner').append('<h6>Question</h6>');
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
                        var $cell = $('<td class="' + props.type + '"><div><div class="inner slot-1"></div></div><div class="mast"></div><div class="anno"></div></td>').appendTo($row);
                        $cell.data('bucket', opts.buckets[j]);
                        $cell.data('resource', opts.buckets[j].bucket_resources[k]);
                        $cell.data('props', props);
                        var $inside = $cell.find('.inner');
                        var $mast = $cell.find('.mast');
                        var $anno = $cell.find('.anno');
                        $anno.css('top', '52vh').text( ((null != props.annotation) ? props.annotation : '') );
                        switch (props.type) {
                            case 'image':
                                $cell.addClass('bigger');
                                $inside.append('<img src="' + props.url + '" />');
                                $mast.append('<div class="title">' + props.title + '</div>');
                                if (null !== props.credit && props.credit) $mast.append('<div class="credit">' + props.credit + '</div>');
                                $anno.css('top', '62.5vh')
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
                $row.find('td').each(function (index) {
                    $(this).data('index', index);
                });
                $row.find('td').each(function (index) {
                    $(this).click(function () {
                        if (null != opts.timer) {  // Stop previous timer
                            clearTimeout(opts.timer);
                            opts.timer = null;
                        };
                        $table.stop(true).find('td').stop(true).children('div').stop(true).children('div').stop(true);
                        $table.removeData('pan_start');
                        // Click (info box)
                        if ($(this).hasClass('current')) {
                            show_details(index);
                        // Click (center)
                        } else {
                            center(index);
                        };
                    });
                    // Pan
                    var hammertime = new Hammer(this);
                    hammertime.get('pan').set({direction: Hammer.DIRECTION_HORIZONTAL});
                    hammertime.on('pan', function (ev) {
                        if (null != opts.timer) {  // Stop previous timer
                            clearTimeout(opts.timer);
                            opts.timer = null;
                        };
                        if (ev.isFinal) {  // Center the chosen item
                            $table.removeData('pan_start');
                            center_closest();
                        } else {  // Move the item along with one's finger
                            if ('undefined' == typeof ($table.data('pan_start'))) {
                                $table.data('pan_start', parseInt($table.css('left')));
                                $table.stop(true).find('td').stop(true).children('div').stop(true).children('div').stop(true);
                            };
                            var pan_end = $table.data('pan_start') + ev.deltaX;
                            $table.css('left', pan_end);
                        };
                    });
                });
                //center($row.children().length-1, false);
                center(0, false);
                $table.animate({
                    'opacity': 1
                });
            });

            var show_details = function (index) {
                var $cell = $table.find('td').eq(index);
                var bucket = $cell.data('bucket');
                var resource = $cell.data('resource');
                var props = $cell.data('props');
                if ('undefined' == typeof (resource)) return;
                if ('image' != props.type) return;
                $self.append('<div class="details_screen"></div>');
                var $details = $('<div class="details"><div><div></div></div><div><div></div><div></div></div></div>').appendTo($self);
                var $left = $details.children(':first');
                var $right = $details.children(':last');
                $left.children(':first').css('background-image', 'url(' + props.url + ')');
                console.log(resource);
                var obj = {
                    'Excerpt Text': [resource.resource.excerpt],
                    'Credit/Citation': [resource.credit_formatted],
                    'Source URL': [resource.resource.source_url],
                    'Courses': [],
                    'Topics': [],
                    'Keywords': [],
                    'Added By': [resource.resource.Owner.name],
                    'Annotation': [resource.annotation],
                    'URL': ['https://crossroads.oxy.edu/resources/'+resource.resource.id]
                };
                for (var j = 0; j < resource.resource.courses.length; j++) {
                    obj['Courses'].push(resource.resource.courses[j].code + ' ' + resource.resource.courses[j].title);
                };
                for (var j = 0; j < resource.resource.keywords.length; j++) {
                    obj['Keywords'].push(resource.resource.keywords[j].title);
                };
                for (var j = 0; j < resource.resource.topics.length; j++) {
                    obj['Topics'].push(resource.resource.topics[j].title);
                };
                var $metadata = $('<table><tbody></tbody></table>').appendTo($right.children(':first'));
                for (var field in obj) {
                    var $row = $('<tr></tr>').appendTo($metadata.children('tbody'));
                    $row.append('<td class="field" valign="top">' + field + '</td>');
                    $row.append('<td class="value" valugn="top"></td>');
                    for (var j = 0; j < obj[field].length; j++) {
                        if (null == obj[field][j]) continue;
                        $row.children('td:last').append(obj[field][j].replace('https://','') + '<br />');
                    }
                }
                $details.find('div:last-of-type > div:last-of-type').append('<button class="btn btn-crossroads btn-add-resource">Add resource to my project</button>&nbsp; &nbsp; &nbsp; <button class="btn btn-secondary btn-email">Email resource</button>');
                $details.append('<button class="btn btn-secondary close-button">Close</button>');
                $details.find('.close-button').mousedown(function () {
                    $('.details_screen, .details').remove();
                });
                $details.find('.btn-add-resource').click(function () {
                    var json = { method: 'coming_soon' };
                    window.external.notify(JSON.stringify(json));
                });
                try {
                    window.external.notify('');
                    $details.find('.btn-email').click(function () {
                        send_email(obj);
                    });
                } catch (err) {
                    $details.find('.btn-email').hide();
                };   
            }

            var send_email = function (obj) {
                var $modal = $('<div id="crossroadsEmailModal" class="modal fade"></div>').appendTo('body');
                $modal.append('<div class="modal-dialog modal-dialog-centered" role="document"><div class="modal-content"><div class="modal-body"><p></p><form><div class="form-group"><input type="email" class="keyboard form-control" placeholder="me@example.com"></div></form></div><div class="modal-footer"><button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button><button type="button" class="btn btn-primary">Send email</button></div></div></div>');
                $modal.find('p:first').html('Send me<br /><b>' + obj['Excerpt Text'] + '</b>');
                $modal.modal({ backdrop: 'static' });
                $modal.find('input[type="email"]').val('').keyboard();
                $modal.find('.btn-primary:last').click(function (event) {
                    event.stopPropagation();
                    var address = $modal.find('input[type="email"]').val();
                    if (!address.length || -1 == address.indexOf('@') || -1 == address.indexOf('.')) {
                        $modal.find('input[type="email"]').focus();
                        return;
                    };
                    $('#crossroadsEmailModal').modal('hide');
                    var json = {};
                    json.method = 'email';
                    json.address = address;
                    json.title = obj['Excerpt Text'][0];
                    json.url = obj['URL'][0];
                    window.external.notify(JSON.stringify(json));
                });
                $modal.off('hidden.bs.modal').on('hidden.bs.modal', function (event) {
                    child_timer(true);
                });
            }

        });

    };

}(jQuery));