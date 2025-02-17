// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Manage rules JS module.
 *
 * @module     tool_dynamic_cohorts/manage_rules
 * @copyright  2024 Catalyst IT
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import Ajax from 'core/ajax';
import Notification from 'core/notification';
import Templates from 'core/templates';
import ModalEvents from 'core/modal_events';
import {get_string as getString} from 'core/str';
import * as DynamicTable from 'core_table/dynamic';
import Fragment from 'core/fragment';
import ModalCancel from 'core/modal_cancel';
import DynamicTableSelectors from 'core_table/local/dynamic/selectors';
import {add as notifyUser} from 'core/toast';

/**
 * A list of used selectors.
 */
const SELECTORS = {
    RULE_MATCHING_USERS: 'tool-dynamic-cohorts-matching-users',
    RULE_CONDITIONS: '.tool-dynamic-cohorts-condition-view',
    RULE_TOGGLE: '.tool-dynamic-cohorts-rule-toggle',
    RULE_DELETE: '.tool-dynamic-cohorts-rule-delete',
};

/**
 * Init of the module.
 */
export const init = () => {
    loadMatchingUsers(document);
    initMatchingUsersModals(document);
    initRuleConditionsModals(document);
    initRuleToggle(document);
    initRuleDelete(document);


    document.addEventListener(DynamicTable.Events.tableContentRefreshed, e => {
        const tableRoot = DynamicTable.getTableFromId(e.target.dataset.tableUniqueid);

        initMatchingUsersModals(tableRoot);
        loadMatchingUsers(tableRoot);
        initRuleConditionsModals(tableRoot);
        initRuleToggle(tableRoot);
        initRuleDelete(tableRoot);
    });
};

/**
 * Initialise modals for matching users.
 *
 * @param {Element} root
 */
const initMatchingUsersModals = (root) => {
    Array.from(root.getElementsByClassName(SELECTORS.RULE_MATCHING_USERS)).forEach((collection) => {
        const ruleid = collection.dataset.ruleid;
        const link = collection.children[1];
        link.addEventListener('click', function(e) {
            e.preventDefault();
            displayMatchingUsers(ruleid);
        });
    });
};

/**
 * Display matching users in the modal form.
 *
 * @param {string} ruleid
 */
const displayMatchingUsers = (ruleid) => {

    ModalCancel.create({
        title: getString('matchingusers', 'tool_dynamic_cohorts'),
        body: getMatchingUsersModalBody(ruleid),
        large: true,
    }).then(function (modal) {
        modal.getRoot().on(ModalEvents.hidden, function() {
            modal.destroy();
        });

        modal.show();
    });
};

/**
 * Get modal html body for matching users using fragment API.
 *
 * @param {string} ruleid
 * @returns {Promise}
 */
const getMatchingUsersModalBody = (ruleid) => {
    const params = {
        ruleid: ruleid,
    };

    return Fragment.loadFragment('tool_dynamic_cohorts', 'matching_users', 1, params);
};

/**
 * Load matching users for each rule.
 *
 * @param {Element} root
 */
const loadMatchingUsers = (root) => {
    Array.from(root.getElementsByClassName(SELECTORS.RULE_MATCHING_USERS)).forEach((collection) => {
        const ruleid = collection.dataset.ruleid;
        const loader = collection.children[0];
        const link = collection.children[1];

        Ajax.call([{
            methodname: 'tool_dynamic_cohorts_get_total_matching_users_for_rule',
            args: {ruleid: ruleid},
            done: function (number) {
                link.children[0].append(number.toLocaleString().replace(/,/g, " "));
                loader.classList.add('hidden');
                link.classList.remove('hidden');
            },
            fail: function (response) {
                Notification.exception(response);
            }
        }]);
    });
};

/**
 * Initialise displaying each rule conditions in a modal.
 *
 * @param {Element} root
 */
const initRuleConditionsModals = (root) => {
    root.querySelectorAll(SELECTORS.RULE_CONDITIONS).forEach(link => {
        let ruleid = link.dataset.ruleid;
        link.addEventListener('click', function() {
            Ajax.call([{
                methodname: 'tool_dynamic_cohorts_get_conditions',
                args: {ruleid: ruleid},
                done: function (conditions) {
                    Templates.render(
                        'tool_dynamic_cohorts/conditions',
                        {'conditions' : conditions, 'hidecontrols': true}
                    ).then(function(html) {
                        ModalCancel.create({
                            title: getString('conditionsformtitle', 'tool_dynamic_cohorts'),
                            body: html,
                            large: true,
                        }).then(function (modal) {
                            modal.getRoot().on(ModalEvents.hidden, function() {
                                modal.destroy();
                            });
                            modal.show();
                        });
                    }).fail(function(response) {
                        Notification.exception(response);
                    });
                },
                fail: function (response) {
                    Notification.exception(response);
                }
            }]);
        });
    });
};

/**
 * Send feedback to a user.
 *
 * @param {string} action Action to send feedback about.
 */
const sendFeedback = (action) => {
    getString('completed:' + action, 'tool_dynamic_cohorts')
        .then(message => {
            notifyUser(message);
        }).catch(Notification.exception);
};

/**
 *
 * @param link
 * @returns {*}
 */
const getDynamicTableFromLink = (link) => {
    return link.closest(DynamicTableSelectors.main.region);
};


/**
 * Initialise displaying each rule conditions in a modal.
 *
 * @param {Element} root
 */
const initRuleToggle = (root) => {
    root.querySelectorAll(SELECTORS.RULE_TOGGLE).forEach(link => {
        let ruleid = link.dataset.ruleid;
        let action = link.dataset.action;
        link.addEventListener('click', function(e) {
            e.preventDefault();
            Notification.confirm(
                getString('confirm', 'moodle'),
                getString(action + '_confirm', 'tool_dynamic_cohorts', ruleid),
                getString('yes', 'moodle'),
                getString('no', 'moodle'),
                function () {
                    Ajax.call([{
                        methodname: 'tool_dynamic_cohorts_toggle_rule_status',
                        args: {ruleid: ruleid},
                        done: function () {
                            sendFeedback(action);
                            DynamicTable.refreshTableContent(getDynamicTableFromLink(link))
                                .catch(Notification.exception);
                        },
                        fail: function (response) {
                            Notification.exception(response);
                        }
                    }]);
                });
        });
    });
};

/**
 * Initialise displaying each rule conditions in a modal.
 *
 * @param {Element} root
 */
const initRuleDelete = (root) => {
    root.querySelectorAll(SELECTORS.RULE_DELETE).forEach(link => {
        let ruleid = link.dataset.ruleid;
        let action = link.dataset.action;
        link.addEventListener('click', function(e) {
            e.preventDefault();
            Notification.confirm(
                getString('confirm', 'moodle'),
                getString(action + '_confirm', 'tool_dynamic_cohorts', ruleid),
                getString('yes', 'moodle'),
                getString('no', 'moodle'),
                function () {
                    Ajax.call([{
                        methodname: 'tool_dynamic_cohorts_delete_rules`',
                        args: {ruleids: {ruleid}},
                        done: function () {
                            sendFeedback(action);
                            DynamicTable.refreshTableContent(getDynamicTableFromLink(link))
                                .catch(Notification.exception);
                        },
                        fail: function (response) {
                            Notification.exception(response);
                        }
                    }]);
                });
        });
    });
};
