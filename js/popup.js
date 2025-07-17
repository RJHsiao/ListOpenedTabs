var main, moved = 0;

function getFavIconUrl(tab) {
	const url = new URL(chrome.runtime.getURL('/_favicon/'));
	url.searchParams.set('pageUrl', tab.url);
	url.searchParams.set('size', '16');
	return url.toString();
}

// generates the html for the tab list
function list(tabs) {
	tabs.forEach(tab => {
		console.debug(`Processing tab: ${tab.title} (${tab.url})`);
		const f = getFavIconUrl(tab);
		const u = tab.url ?? '';
		const t = !tab.title ? u : tab.title;

		const li = document.createElement('div');
		li.tabIndex = 0;
		li.className = 'item' + (tab.selected ? ' selected' : '');

		const group = document.createElement('div');
		group.className = 'group';
		if (tab.groupId != chrome.tabGroups.TAB_GROUP_ID_NONE) {
			chrome.tabGroups.get(tab.groupId).then(groupInfo => {
				console.debug(`Tab group info: ${JSON.stringify(groupInfo)}`);
				group.style.backgroundColor = groupInfo.color;
				group.title = groupInfo.title;
			})
		}
		li.appendChild(group);

		const favicon = document.createElement('img');
		favicon.src = f;
		favicon.title = u;
		li.appendChild(favicon);

		const title = document.createElement('div');
		title.className = 'title';
		if (t.length > 38)
			title.title = t;
		title.textContent = t;
		li.appendChild(title);

		if (!tab.pinned) {
			const close = document.createElement('div');
			close.className = 'close';
			close.title = 'Close Tab';
			close.textContent = 'x';
			li.appendChild(close);
		}

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
    chrome.tabs.query({ currentWindow: true }, list);
    $('#search').focus();
    onkeydown = onkeypress = mute;
    mode();
    setInterval(mode, 50);
});
