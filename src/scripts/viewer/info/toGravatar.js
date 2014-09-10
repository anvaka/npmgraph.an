var md5 = require('js-md5');

module.exports = toGravatar;

function toGravatar(author) {
  return {
    avatar: 'https://secure.gravatar.com/avatar/' + md5(author.email.toLowerCase()) + '?s=25&d=retro',
    profile: 'https://www.npmjs.org/~' + author.name,
    name: author.name,
    email: author.email
  };
}
