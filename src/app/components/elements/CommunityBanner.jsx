import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link, browserHistory } from 'react-router';
import { proxifyImageUrl } from 'app/utils/ProxifyUrl';
import { numberWithCommas } from 'app/utils/StateFunctions';
import { Role } from 'app/utils/Community';
import Userpic from 'app/components/elements/Userpic';
import SubscribeButton from 'app/components/elements/SubscribeButton';
import SettingsEditButton from 'app/components/elements/SettingsEditButton';
import Icon from 'app/components/elements/Icon';
import * as userActions from 'app/redux/UserReducer';
import * as globalActions from 'app/redux/GlobalReducer';

class CommunityBanner extends Component {
    render() {
        const {
            profile,
            community,
            category,
            loggedIn,
            showLogin,
            showRecentSubscribers,
            showModerationLog,
        } = this.props;

        const viewer_role = community.getIn(['context', 'role'], 'guest');
        const canPost = Role.canPost(category, viewer_role);

        const checkIfLogin = () => {
            if (!loggedIn) {
                return showLogin();
            }
            return browserHistory.replace(`/submit.html?category=${category}`);
        };

        const handleSubscriberClick = () => {
            showRecentSubscribers(community);
        };

        const handleModerationLogCLick = e => {
            e.preventDefault();
            showModerationLog(community);
        };

        const { cover_image } = profile
            ? profile.getIn(['metadata', 'profile']).toJS()
            : {};
        let cover_image_style = {};
        if (cover_image) {
            cover_image_style = {
                backgroundImage:
                    'url(' + proxifyImageUrl(cover_image, '2048x512') + ')',
            };
        }

        const roles = Role.atLeast(viewer_role, 'mod') && (
            <Link to={`/roles/${category}`}>Roles</Link>
        );

        const settings = Role.atLeast(viewer_role, 'admin') && (
            <SettingsEditButton community={community.get('name')}>
                Settings
            </SettingsEditButton>
        );

        return (
            <div>
                <div className="UserProfile__banner row expanded">
                    <div className="column CommunityBanner" style={cover_image_style}>
                        <div className="CommunityTitle">
                            <Userpic account={category} />
                            <div className="TextContainer">
                                <h1>{community.get('title')}</h1>
                                <p>{community.get('about')}</p>
                            </div>
                            <div className="AdditionalActions">
                                <div className="ModeratorRoles">
                                    {roles && (
                                        <div>
                                            Edit{': '}
                                            {roles}
                                            {settings && (
                                                <span>
                                                    {' / '}
                                                    {settings}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="ActivityLog">
                                    <a onClick={handleModerationLogCLick}>
                                        Activity Log
                                    </a>
                                    {community.get('is_nsfw') && (
                                        <span className="affiliation">nsfw</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="CommunityActions">
                            {community && (
                                <SubscribeButton
                                    community={community.get('name')}
                                    display="block"
                                />
                            )}
                            {canPost && (
                                <Link
                                    className="button primary"
                                    onClick={checkIfLogin}
                                >
                                    <Icon name="pencil" size="2x" /> New Post
                                </Link>
                            )}
                        </div>
                        <div className="CommunityAttributes">
                            <div className="CommunitySubscribers" onClick={handleSubscriberClick} role="button" tabIndex="0" aria-label="View recent subscribers"><p>{numberWithCommas(community.get('subscribers'))}<span className="CommunityLabel">{community.get('subscribers') == 1
                                ? 'subscriber'
                                : 'subscribers'}</span></p></div>
                            <p>${numberWithCommas(community.get('sum_pending'))}<span className="CommunityLabel">pending rewards</span></p>
                            <p>{numberWithCommas(community.get('num_authors'))}<span className="CommunityLabel">active posters</span></p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default connect(
    // mapStateToProps
    (state, props) => ({
        profile: props.profile,
        community: state.global.getIn(['community', props.category], null),
        loggedIn: !!state.user.getIn(['current', 'username']),
    }),
    // mapDispatchToProps
    dispatch => {
        return {
            showLogin: e => {
                if (e) e.preventDefault();
                dispatch(userActions.showLogin({ type: 'basic' }));
            },
            showRecentSubscribers: community => {
                dispatch(
                    globalActions.showDialog({
                        name: 'communitySubscribers',
                        params: { community },
                    })
                );
            },
            showModerationLog: community => {
                dispatch(
                    globalActions.showDialog({
                        name: 'communityModerationLog',
                        params: { community },
                    })
                );
            },
        };
    }
)(CommunityBanner);
