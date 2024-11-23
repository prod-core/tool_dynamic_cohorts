<?php
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

namespace tool_dynamic_cohorts\external;

use externallib_advanced_testcase;
use tool_dynamic_cohorts\rule;

defined('MOODLE_INTERNAL') || die();

global $CFG;
require_once($CFG->dirroot . '/webservice/tests/helpers.php');

/**
 * Tests for matching users external APIs .
 *
 * @package    tool_dynamic_cohorts
 * @copyright  2024 Catalyst IT
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 *
 * @covers     \tool_dynamic_cohorts\external\rules
 */
class rules_test extends externallib_advanced_testcase {

    /**
     * Test exception if rule is not exist.
     */
    public function test_delete_rules_exception_on_invalid_rule() {
        $this->resetAfterTest();

        $this->setAdminUser();
        $this->expectException(\invalid_parameter_exception::class);
        $this->expectExceptionMessage('Rule does not exist. ID: 777');

        rules::delete_rules([777]);
    }

    /**
     * Test required permissions.
     */
    public function test_delete_rules_permissions() {
        $this->resetAfterTest();
        $user = $this->getDataGenerator()->create_user();
        $this->setUser($user);

        $this->expectException(\required_capability_exception::class);
        $this->expectExceptionMessage('Sorry, but you do not currently have permissions to do that (Manage rules).');

        rules::delete_rules([777]);
    }

    /**
     * Test can get total.
     */
    public function test_exception_delete_rules_when_one_is_invalid() {
        $this->resetAfterTest();
        $this->setAdminUser();

        $rule = new rule(0, (object)['name' => 'Test rule 1']);
        $rule->save();

        $this->expectException(\invalid_parameter_exception::class);
        $this->expectExceptionMessage('Rule does not exist. ID: 777');

        rules::delete_rules([$rule->get('id'), 777]);
    }

    /**
     * Test can get total.
     */
    public function test_delete_rules_keep_rules_when_one_is_invalid() {
        $this->resetAfterTest();
        $this->setAdminUser();

        $rule1 = new rule(0, (object)['name' => 'Test rule 1']);
        $rule1->save();

        $rule2 = new rule(0, (object)['name' => 'Test rule 2']);
        $rule2->save();

        $this->assertCount(2, rule::get_records());

        $this->expectException(\required_capability_exception::class);
        $this->expectExceptionMessage('Rule does not exist. ID: 777');

        try {
            rules::delete_rules([$rule1->get('id'), $rule2->get('id'), 777]);
        } catch (\invalid_parameter_exception $exception) {
            $this->assertSame(
                'Invalid parameter value detected (Rule does not exist. ID: 777)',
                $exception->getMessage()
            );
            $this->assertCount(2, rule::get_records());
        }
    }
}
