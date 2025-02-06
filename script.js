// Load saved data
let comments = JSON.parse(localStorage.getItem('comments')) || [];
let user = JSON.parse(localStorage.getItem('user')) || { 
    name: '', 
    avatar: 'logo.png' 
};

// Initialize user
document.getElementById('userName').value = user.name;
document.getElementById('userAvatar').src = user.avatar;

// Event listeners
document.getElementById('userName').addEventListener('change', saveUser);
document.getElementById('avatarInput').addEventListener('change', handleAvatarUpload);

function saveUser() {
    user.name = document.getElementById('userName').value;
    localStorage.setItem('user', JSON.stringify(user));
}

function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            user.avatar = e.target.result;
            document.getElementById('userAvatar').src = user.avatar;
            localStorage.setItem('user', JSON.stringify(user));
        }
        reader.readAsDataURL(file);
    }
}

function postComment() {
    const text = document.getElementById('commentInput').value.trim();
    if (!text) return;

    const newComment = {
        id: Date.now(),
        author: { ...user },
        text,
        time: new Date(),
        replies: [],
        reactions: {}
    };

    comments.push(newComment);
    saveAndRender();
    document.getElementById('commentInput').value = '';
}

function postReply(parentId, text, replyAvatar) {
    const parentComment = findComment(comments, parentId);
    if (!parentComment || !text.trim()) return;

    const replier = {
        name: user.name,
        avatar: replyAvatar || user.avatar
    };

    parentComment.replies.push({
        id: Date.now(),
        author: replier,
        text,
        time: new Date(),
        reactions: {}
    });

    saveAndRender();
}

function addReaction(commentId, emoji) {
    const comment = findComment(comments, commentId);
    if (comment) {
        comment.reactions[emoji] = (comment.reactions[emoji] || 0) + 1;
        saveAndRender();
    }
}

function findComment(arr, id) {
    for (const item of arr) {
        if (item.id === id) return item;
        if (item.replies.length) {
            const found = findComment(item.replies, id);
            if (found) return found;
        }
    }
}

function saveAndRender() {
    localStorage.setItem('comments', JSON.stringify(comments));
    renderComments();
}

function renderComments() {
    const container = document.getElementById('commentsContainer');
    container.innerHTML = '';
    comments.forEach(comment => renderComment(comment, container));
}

function renderComment(comment, parent) {
    const div = document.createElement('div');
    div.className = 'comment';
    div.innerHTML = `
        <div class="comment-header">
            <img src="${comment.author.avatar}" class="avatar">
            <strong class="editable-username" onclick="editUsername(${comment.id})">${comment.author.name}</strong>
            <span class="time">${getTimeAgo(comment.time)}</span>
        </div>
        <p>${comment.text}</p>
        <div class="comment-actions">
            <span class="reaction-btn" onclick="toggleReactions(this, ${comment.id})">
                👍
                <div class="reactions-picker">
                    <span class="reaction-emoji" onclick="addReaction(${comment.id}, '👍')">👍</span>
                    <span class="reaction-emoji" onclick="addReaction(${comment.id}, '❤️')">❤️</span>
                    <span class="reaction-emoji" onclick="addReaction(${comment.id}, '😄')">😄</span>
                    <span class="reaction-emoji" onclick="addReaction(${comment.id}, '😲')">😲</span>
                    <span class="reaction-emoji" onclick="addReaction(${comment.id}, '😡')">😡</span>
                    <span class="reaction-emoji" onclick="addReaction(${comment.id}, '🥳')">🥳</span>
                </div>
            </span>
            <span onclick="showReplyBox(${comment.id})">Rispondi</span>
            ${renderReactions(comment.reactions)}
        </div>
        <div id="replies-${comment.id}" class="replies"></div>
    `;
    
    parent.appendChild(div);
    comment.replies.forEach(reply => renderComment(reply, div.querySelector(`#replies-${comment.id}`)));
}

function renderReactions(reactions) {
    return Object.entries(reactions).map(([emoji, count]) => 
        `<span class="reaction-count">${emoji} ${count}</span>`
    ).join('');
}

function toggleReactions(btn, commentId) {
    const picker = btn.querySelector('.reactions-picker');
    picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
}

function showReplyBox(commentId) {
    const replyContainer = document.createElement('div');
    replyContainer.innerHTML = `
        <div class="profile-section">
            <div class="avatar-upload">
                <input type="file" class="reply-avatar-input" accept="image/*">
                <img src="profile.png" class="avatar reply-avatar">
            </div>
            <textarea class="reply-input" placeholder="Scrivi un Rispondi..."></textarea>
            <button onclick="postReplyWithAvatar(${commentId})"> Pubblica Rispondi</button>
        </div>
    `;
    document.querySelector(`#replies-${commentId}`).appendChild(replyContainer);

    const avatarInput = replyContainer.querySelector('.reply-avatar-input');
    avatarInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                replyContainer.querySelector('.reply-avatar').src = e.target.result;
            }
            reader.readAsDataURL(file);
        }
    });
}

function postReplyWithAvatar(commentId) {
    const replyContainer = document.querySelector(`#replies-${commentId} .profile-section`);
    const replyText = replyContainer.querySelector('.reply-input').value.trim();
    const replyAvatar = replyContainer.querySelector('.reply-avatar').src;

    if (replyText) {
        postReply(commentId, replyText, replyAvatar);
    }
}

function editUsername(commentId) {
    const comment = findComment(comments, commentId);
    if (!comment) return;

    const newName = prompt("Enter new username:", comment.author.name);
    if (newName && newName.trim()) {
        comment.author.name = newName.trim();
        saveAndRender();
    }
}

function clearComments() {
    if (confirm("Are you sure you want to clear all comments?")) {
        comments = [];
        saveAndRender();
    }
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    const intervals = {
        year: 31536000,
        month: 2592000,
        day: 86400,
        hour: 3600,
        minute: 60,
        second: 1
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
        }
    }
    return 'Proprio adesso';
}

// Initial render
renderComments();