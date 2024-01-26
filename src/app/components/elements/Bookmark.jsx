import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
// import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate';
import * as transactionActions from 'app/redux/TransactionReducer';
import Icon from 'app/components/elements/Icon';
import tt from 'counterpart';
import { userActionRecord } from 'app/utils/ServerApiClient';

const { string, func } = PropTypes;

export default class Bookmark extends React.Component {
    static propTypes = {
        account: string,
        author: string,
        permlink: string,
        bookmark: func,
    };
    constructor(props) {
        super(props);
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'Bookmark');
        this.state = { active: false, loading: false };
    }

    componentWillMount() {
        const { account } = this.props;
        if (account) {
            this.setState({ active: this.isBookmarked(account) });
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.account) {
            this.setState({ active: this.isBookmarked(nextProps.account) });
        }
    }

    isBookmarked(account) {
        const { author, permlink } = this.props;
        // console.log('isBookmarked', account, author, permlink, getBookmarkList(account).includes(author + '/' + permlink));
        return getBookmarkList(account, this.props.global).includes(
            author + '/' + permlink
        );
    }

    // TODO ändern für Speicherung im globalen State
    setBookmark(account) {
        const { author, permlink } = this.props;
        // console.log('setBookmark', account, author, permlink);
        clearBookmarkCache();
        let posts = getBookmarkList(account);
        posts.push(author + '/' + permlink);
        // console.log('setBookmark posts', posts);
        if (posts.length > 200) posts.shift(1);
        localStorage.setItem('bookmarked_' + account, JSON.stringify(posts));
    }

    // TODO ändern für Speicherung im globalen State
    removeBookmark(account) {
        const { author, permlink } = this.props;
        // console.log('removeBookmark', account, author, permlink);
        clearBookmarkCache();
        let posts = getBookmarkList(account);
        posts = posts.filter(item => item !== author + '/' + permlink);
        localStorage.setItem('bookmarked_' + account, JSON.stringify(posts));
    }

    // Methode von this, die Bookmarks verwaltet
    manageBookmark = e => {
        e.preventDefault();
        const { handleBookmark, account, author, permlink } = this.props;
        this.setState({ loading: true });
        const isBookmarked = this.isBookmarked(account);
        const action = isBookmarked ? 'remove' : 'add';

        handleBookmark(
            account,
            author,
            permlink,
            action,
            'dummy', // TODO zunaechst als fester string
            () => {
                this.setState({ active: !isBookmarked, loading: false });
                if (isBookmarked) {
                    this.removeBookmark(account);
                } else {
                    this.setBookmark(account);
                }
                // console.log('Bookmark success', 'active:', this.state.active, 'isBookmarked:', isBookmarked);
            },
            () => {
                this.setState({ active: isBookmarked, loading: false });
                // console.log('Bookmark failed', 'active:', this.state.active, 'isBookmarked:', isBookmarked);
            }
        );
    };

    render() {
        const state = this.state.active ? 'active' : 'inactive';
        const loading = this.state.loading ? ' loading' : '';
        const title = this.state.active
            ? tt('g.remove_bookmark')
            : tt('g.add_bookmark');
        return (
            <span
                className={
                    'Bookmark__button Bookmark__button-' + state + loading
                }
            >
                <a href="#" onClick={this.manageBookmark} title={title}>
                    <Icon name="bookmark" />
                </a>
            </span>
        );
    }
}
module.exports = connect(
    (state, ownProps) => {
        const account =
            state.user.getIn(['current', 'username']) ||
            state.offchain.get('account');
        const global = state.global;
        return { ...ownProps, account, global };
    },
    dispatch => ({
        handleBookmark: (
            account,
            author,
            permlink,
            action,
            category,
            successCallback,
            errorCallback
        ) => {
            const json = [
                'bookmark',
                { account, author, permlink, action, category },
            ];
            dispatch(
                transactionActions.broadcastOperation({
                    type: 'custom_json',
                    operation: {
                        id: 'follow', // TODO wenn final, _test entfernen
                        required_posting_auths: [account],
                        json: JSON.stringify(json),
                    },
                    successCallback,
                    errorCallback,
                })
            );
        },
    })
)(Bookmark);

let lastAccount;
let cachedPosts;

function getBookmarkList(account, global) {
    if (!process.env.BROWSER) return [];

    if (lastAccount === account) return cachedPosts;

    lastAccount = account;
    const posts = global.getIn(['bookmarkedPosts', account]);
    cachedPosts = posts ? posts : [];
    return cachedPosts;
}

function clearBookmarkCache() {
    lastAccount = null;
}
