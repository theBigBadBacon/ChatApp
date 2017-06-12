var channelItem = Vue.component('channel', {
	props: ['data', 'name'],
	methods: {
		joinTheChannel: function(e) {
			if (e.target.className !== 'material-icons' && !this.data.isActive) {
				console.log('joining...');
				joinChannel(this.name);
			}
		},
		leaveTheChannel: function(e) {
			e.stopPropagation();
			if (e.target.className === 'material-icons' && !this.data.isActive) {
				console.log('leaving...');
				leaveChannel(this.name);
			}
		}
	},
	template: `<li @click="joinTheChannel" :class="['connection', data.isActive ? 'is-active' : '', data.isUnread ? 'connection--unread' : '']">
		<div class="connection-name">{{ name }}</div>
		<span @click="leaveTheChannel" class="connection-close js-close">
			<i class="material-icons">close</i>
		</span>
	</li>`
});

var chatItem = Vue.component('chat-item', {
	props: ['data'],
	template: `<div class="chat-board-item">
		<div class="chat-board-item-user col-4">
			{{ data.user }}
		</div>
		<div class="chat-board-item-message col-8">
			{{ data.message }}
		</div></div>`
});

var infoplace = new Vue({
	el: '#statusMessage',
	data: {
		isActive: false,
		statusClasses: '',
		message: 'Welcome! Start by selecting a username and join / host a channel'
	}
});

var connectionList = new Vue({
	el: '#connections',
	data: {
		activeChannel: '#All',
		channels: {
			'#All': {
				isActive: true,
				isUnread: false,
				room: '#All'
			}
		}
	},
	computed: {
		/*
		activeChannel: function() {
			var channel = '#';
			for (var item in this.channels) {
				console.log(item, this.channels[item].isActive);
				if (this.channels[item].isActive) {
					channel = item.id;
				}
			}

			return channel;
		},
		*/
		deactivateAll: function() {
			for (var item in this.channels) {
				//console.log(item, this.channels[item].isActive);
				if (this.channels[item].isActive) {
					this.channels[item].isActive = false;
				}
			}
		}
	},
	watch: {
		channels: function() {
			return Date.now()
		}
	}
});

var chat = new Vue({
	el: '#content',
	data: {
		messages: []
		/*newMessages: 'salamander',
		scrollBottom: function() {
			scrollToBottom();
		}*/
	}
});
/* This was NOT commented
var infobar = new Vue({
	el: '#infobar',
	data: {
		resultList: []
	}
});
*/
//This WAS
var results = new Vue({
	el: '#infobar2',
	data: {
		isHidden: true,
		resultList: [],
		resultJoin: function(e) {
			var channel = e.target.childNodes[0].nodeValue;
			joinChannel(channel.trim());
		}
	}
});
/*
function scrollToBottom() {
	console.log(chatTarget);
	var before = chatTarget.scrollTop;
	var pace = chatTarget.scrollHeight < 100 ? 100 : (chatTarget.scrollHeight / 10);
	chatTarget.scrollTop += pace;
	if (before < chatTarget.scrollTop) {
		setTimeout(function() {
			scrollToBottom();
		}, 50);
	}
}
*/
