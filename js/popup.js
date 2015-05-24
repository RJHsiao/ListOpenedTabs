var main, moved = 0;

// generates the html for the tab list
function list(tabs) {
	tabs.forEach(function(tab) {
		var f = tab.favIconUrl, t = tab.title, u = tab.url;
		if (!u) u = '';
		if (!t) t = u;

		// workaround
		if (f == 'chrome://theme/IDR_EXTENSIONS_FAVICON') f = 'data:image/x-icon;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAABF0lEQVQoz2P4z4AfMpCgQMfI6LbBZi0mnArCK73f+jyOZMWiQENOU0KHe3N01KuOg/+ZNHg0ZNSZUBSYn7T8aP3B6230y5DX9u8tP5p+suZDURD6IOJV1Mu4FynPE19Ev4x85fvmPweKgrj76c8ykWDkKwtOTVUNHriC5atfLNy2Nf05TEHMS9d9Fh9M98IVvLb5z7c5IOEFTEHy88yrIa+DH8AVmDwy7/BeEwdXkPrsf+3aHXsXwhX4P/V7E/I6+8HpNUCLgAqiX7qw/rf+rwZXkHEj8UXii5aj/1Xv26c+yXwW8SpIAsUX1fvz72c/ir38n8EtO/Fx1Y2ai63yqEEd97/zf///eiDL8X/f/9r/Wf95iI5NALw5DuHmTOHfAAAAAElFTkSuQmCC';

		var li = document.createElement('div');
		li.tabIndex = 0;
		li.className = 'item' + (tab.selected ? ' selected' : '');

		var favicon = document.createElement('img');
		if (f) favicon.src = f;
		if (u) favicon.title = u;

		var title = document.createElement('div');
		title.className = 'title';
		if (t.length > 38)
			title.title = t;
		title.textContent = t;

		var close = document.createElement('div');
		close.className = 'close';
		close.title = 'Close Tab';
		close.textContent = 'x';

		li.appendChild(favicon);
		li.appendChild(title);
		li.appendChild(close);

		li.tabId = tab.id;
		li.url = u;
		li.search = ((t && t != u ? t : '') + ' ' + (u || '')).toLowerCase();
		main.appendChild(li);
	});
	anim();
}

// binds all the event listeners
function anim() {

	$('.close').click(function(e) {
		closeTab(e, e.currentTarget.parentNode);
	});

	$('.item').mousedown(function(e) {
		if (!e.button) {
			main.tabId = e.currentTarget.tabId;
			moved = 0;
		}
	});

	$('.item').click(function(e) {
		if (!e.button && !moved)
			chrome.tabs.update(e.currentTarget.tabId, { selected : true });
		if (e.button == 1)
			closeTab(e, e.currentTarget);
	});

	$('.item, #search').keydown(function(e) {
		if (e.ctrlKey || e.altKey || e.shiftKey)
			return;
		var s = e.currentTarget, p;
		if (e.keyCode == 38) p = 'previousSibling';
		else if (e.keyCode == 40) p = 'nextSibling';
		else return;
		while (s = s[p])
			if (s.focus && getComputedStyle(s).display != 'none')
				return s.focus();
	});

	$('.item').keyup(function(e) {
		if (e.keyCode == 13)
			chrome.tabs.update(e.currentTarget.tabId, { selected : true });
		if (e.keyCode == 46)
			closeTab(e, e.currentTarget);
	});

	$('#search').bind('keyup change', function(e) {
		var v = $(this).val();
		if (v) {
			$('#main').sortable('disable');
			v = v.toLowerCase().split(' ');
			$('.item').each(function() {
				for (var i = 0; i < v.length; i++) {
					if (this.search.indexOf(v[i]) == -1) {
						$(this).css('display', 'none');
						break;
					}
				}
				if (i >= v.length)
					$(this).css('display', 'block');
			});
		}
		else {
			$('.item').css('display', 'block');
			$('#main').sortable('enable');
		}
	});

	// makes the tab list sortable with drag-and-drop
	$('#main').sortable({
		forcePlaceholderSize: true,
		opacity: .7,
		distance: 5,
		scroll: false,
		containment: 'parent',
		axis: 'y',
		items: '.item',
		cancel: '.close',
		tolerance: 'pointer',
		start: function() {
			if (!document.body.className)
				document.body.style.cssText = 'overflow-y: hidden';
			moved = 1;
		},
		stop: function() {
			document.body.style.cssText = '';
		},
		update: function() {
			if (main.tabId) {
				var i, t = document.querySelectorAll('.item');
				for (i = 0; i < t.length; i++)
					if (main.tabId == t[i].tabId)
						break;
				if (i < t.length) {
					chrome.tabs.move(main.tabId, { index: i }, function(tab) {
						chrome.tabs.get(tab.id, function(t) {
							if (t.index != i)
								location.reload();
							else if (document.documentElement.className == 'osx')
								chrome.tabs.create( { selected : false }, function(t) { chrome.tabs.remove(t.id); } );
						});
					});
					main.tabId = 0;
				}
			}
		}
	});
}

// removes tab
function closeTab(e, tab) {
	tab = main.removeChild(tab);
	chrome.tabs.remove(tab.tabId);
	e.stopPropagation();
	e.preventDefault();
}

// suppresses typing while not focused
function mute(e) {
	if (document.activeElement != $('#search')[0] && e.keyCode != 9)
		e.preventDefault();
}

// checks for page overflow
function mode() {
	var noscroll = document.body.clientWidth < innerWidth ? 'overflow' : '';
	if (document.body.className != noscroll)
		document.body.className = noscroll;
}

$(document).ready(function() {
	main = document.getElementById('main');
	if (~navigator.userAgent.indexOf('Macintosh'))
		document.documentElement.className = 'osx';
	chrome.tabs.getAllInWindow(null, list);
	$('#search').focus();
	onkeydown = onkeypress = mute;
	mode();
	setInterval(mode, 50);
});
