"use strict";

class ExpectedError {
    constructor(name, msg_regex) {
        this.name = name;
        this.msg_regex = msg_regex;
    }
}

function runTests() {
    const test_runners = [
        runFormulaTests,
        runMathTests,
    ];
    let test_results = [];
    for (let test_runner of test_runners) {
        let recorder = function(test_body, expected_value) {
            let trace_error = new Error();
            recorder.total_test_count += 1;
            let test_body_value = null;
            try {
                test_body_value = test_body();
            } catch (e) {
                trace_error = e;
                if (expected_value instanceof ExpectedError) {
                    if (expected_value.name == e.name) {
                        if (!expected_value.msg_regex || expected_value.msg_regex.test(e.message)) {
                            // test passed with expected error
                            expected_value = null;
                        }
                    }
                }
            }
            if (test_body_value === expected_value) {
                recorder.passed_test_count += 1;
            } else {
                const stack_trace_lines = trace_error.stack.split('\n');
                let failure_info = "unknown location in '" + test_runner.name + "'";
                for (let line of stack_trace_lines) {
                    if (line.includes(test_runner.name)) {
                        failure_info = line;
                        break;
                    }
                }
                if (!trace_error.message) {
                    failure_info = "expected '" + expected_value + "' but test yielded '" + test_body_value + "' in " + failure_info;
                } else {
                    failure_info = "exception '" + trace_error.name + ": " + trace_error.message + "' in " + failure_info +  " <pre>" + trace_error.stack + "</pre>";
                }
                recorder.failures.push(failure_info);
            }
        };
        recorder.total_test_count = 0;
        recorder.passed_test_count = 0;
        recorder.group_name = "unknown test group";
        recorder.failures = [];
        test_runner(recorder);
        test_results.push(recorder);
    }
    let list_body = "";
    for (let result of test_results) {
        list_body += "<li>";
        list_body += "<div>";

        list_body += "<div>";
        list_body += "test group '" + result.group_name + "': ";
        list_body += result.passed_test_count + "/" + result.total_test_count + " tests passed";
        list_body += "</div>";
        list_body += "<ol style='list-style-type:square;'>";
        for (let failure of result.failures) {
            list_body += "<li>";
            list_body += "failure: " + failure;
            list_body += "</li>";
        }
        list_body += "</ol>";

        list_body += "</div>";
        list_body += "</li>";
    }
    document.getElementById("test-list").innerHTML = list_body;
}

onload = () => {
    runTests();
};
