import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
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

    componentDidMount() {
        const { account } = this.props;
        if (account) {
            this.setState({ active: this.isBookmarked(account) });
        }
    }

    static getDerivedStateFromProps(nextProps, prevState) {
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
        const { bookmarked_by } = this.props;
        return bookmarked_by && bookmarked_by.includes(account);
    }

    updateBookmark(account, action) {
        const { author, permlink } = this.props;
        this.props.updateBookmarkStore(author, permlink, action, account);
    }

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
            '', // category currently unused
            () => {
                this.setState({ active: !isBookmarked, loading: false });
                this.updateBookmark(account, action);
            },
            () => {
                this.setState({ active: isBookmarked, loading: false });
            }
        );
    };

    render() {
        const state = this.state.active ? 'active' : 'inactive';
        const loading = this.state.loading ? ' loading' : '';
        const bookmarkSize =
            (this.props.bookmarked_by && this.props.bookmarked_by.size) || 0;
        const title = this.state.active
            ? tt('g.remove_bookmark')
            : tt('g.add_bookmark');
        const counts = tt('g.bookmark_count', { count: bookmarkSize });
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
                    {bookmarkSize}
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
        updateBookmarkStore: (author, permlink, action, account) =>
            dispatch(
                globalActions.updateBookmarks({
                    author,
                    permlink,
                    action,
                    account,
                })
            ),
    })
)(Bookmark);
