import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
// import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate';
import * as transactionActions from 'app/redux/TransactionReducer';
import Icon from 'app/components/elements/Icon';
import tt from 'counterpart';
import * as globalActions from '../../redux/GlobalReducer';

const { string, func } = PropTypes;

export default class Bookmark extends React.Component {
    static propTypes = {
        account: string,
        author: string,
        permlink: string,
    };

    constructor(props) {
        super(props);
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'Bookmark');
        this.state = { active: false, loading: false };
    }

    static callFunction(author, callFunc) {
        // calls the logfunction if author is elkezaksek
        if (author === 'elkezaksek') {
            callFunc();
        }
    }

    componentDidMount() {
        Bookmark.callFunction(this.props.author, () =>
            console.log(
                'Bookmarks componentDidMount',
                'props.bookmarked_by:',
                this.props.bookmarked_by
            )
        );
        const { account } = this.props;
        if (account) {
            this.setState({ active: this.isBookmarked(account) });
        }
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        console.log(
            'Bookmarks getDerivedStateFromProps',
            'active state',
            prevState.active,
            'nextState',
            nextProps.bookmarked_by.includes(nextProps.account)
        );
        if (
            nextProps.account &&
            prevState.active !==
                nextProps.bookmarked_by.includes(nextProps.account)
        ) {
            return {
                active: nextProps.bookmarked_by.includes(nextProps.account),
                loading: prevState.loading,
            };
        }
        return null;
    }

    isBookmarked(account) {
        const { author, permlink, bookmarked_by } = this.props;
        Bookmark.callFunction(author, () =>
            console.log(
                'isBookmarked',
                bookmarked_by && bookmarked_by.includes(account),
                account,
                author,
                permlink,
                bookmarked_by
            )
        );
        return bookmarked_by && bookmarked_by.includes(account);
    }

    setBookmark(account) {
        const { author, permlink, bookmarked_by } = this.props;
        Bookmark.callFunction(author, () =>
            console.log('setBookmark', account, author, permlink)
        );
        this.props.updateGlobalStore(author, permlink, 'add', account);
        // this.setState({ active: true });
    }

    removeBookmark(account) {
        const { author, permlink, bookmarked_by } = this.props;
        Bookmark.callFunction(author, () =>
            console.log('removeBookmark', account, author, permlink)
        );
        this.props.updateGlobalStore(author, permlink, 'remove', account);
        // this.setState({ active: this.isBookmarked(account) });
    }

    // Methode von this, die Bookmarks verwaltet
    manageBookmark = e => {
        e.preventDefault();
        const { handleBookmark, account, author, permlink } = this.props;
        this.setState({ loading: true });
        const isBookmarked = this.isBookmarked(account);
        Bookmark.callFunction(author, () =>
            console.log('manageBookmark', 'isBookmarked:', isBookmarked)
        );
        const action = isBookmarked ? 'remove' : 'add';

        handleBookmark(
            account,
            author,
            permlink,
            action,
            'dummy', // TODO zunaechst als fester string
            () => {
                Bookmark.callFunction(author, () =>
                    console.log(
                        'Bookmark success before setState',
                        'active:',
                        this.state.active,
                        'isBookmarked:',
                        isBookmarked,
                        'author:',
                        author
                    )
                );
                this.setState({ active: !isBookmarked, loading: false });
                if (isBookmarked) {
                    this.removeBookmark(account);
                } else {
                    this.setBookmark(account);
                }
                Bookmark.callFunction(author, () =>
                    console.log(
                        'Bookmark success after setState',
                        'state.active:',
                        this.state.active,
                        'isBookmarked:',
                        isBookmarked
                    )
                );
            },
            () => {
                this.setState({ active: isBookmarked, loading: false });
                Bookmark.callFunction(author, () =>
                    console.log(
                        'Bookmark failed',
                        'state.active:',
                        this.state.active,
                        'isBookmarked:',
                        isBookmarked
                    )
                );
            }
        );
    };

    render() {
        const state = this.state.active ? 'active' : 'inactive';
        const loading = this.state.loading ? ' loading' : '';
        Bookmark.callFunction(this.props.author, () =>
            console.log(
                'Bookmark render',
                'state:',
                state,
                'loading:',
                loading,
                'state.active:',
                this.state.active,
                'state.loading:',
                this.state.loading,
                'this.author:',
                this.props.author
            )
        );
        const title = this.state.active
            ? tt('g.remove_bookmark')
            : tt('g.add_bookmark');
        const counts = tt('g.bookmark_count', {
            count: this.props.bookmarked_by.size,
        });
        return (
            <span
                className={
                    'Bookmark__button Bookmark__button-' + state + loading
                }
            >
                <a href="#" onClick={this.manageBookmark} title={title}>
                    <Icon name="bookmark" />
                </a>
                &nbsp;
                <span className="Bookmark__count" title={counts}>
                    {this.props.bookmarked_by.size}
                </span>
            </span>
        );
    }
}
module.exports = connect(
    (state, ownProps) => {
        const account =
            state.user.getIn(['current', 'username']) ||
            state.offchain.get('account');
        const bookmarked_by = state.global.getIn([
            'content',
            ownProps.author + '/' + ownProps.permlink,
            'bookmarked_by',
        ]);
        // const bookmarked_by = ['moecki.tests'];
        return { ...ownProps, account, bookmarked_by };
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
                        id: 'follow',
                        required_posting_auths: [account],
                        json: JSON.stringify(json),
                    },
                    successCallback,
                    errorCallback,
                })
            );
        },
        updateGlobalStore: (author, permlink, bookmark_action, account) =>
            dispatch(
                globalActions.updateBookmarks({
                    author,
                    permlink,
                    bookmark_action,
                    account,
                })
            ),
    })
)(Bookmark);
