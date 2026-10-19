/**
 * Shangrilla Gardens & BBQ - Test Harness Execution Engine
 * Lightweight, zero-dependency BDD in-browser test framework
 */

(function (window) {
  'use strict';

  class TestAssertionError extends Error {
    constructor(message) {
      super(message);
      this.name = 'TestAssertionError';
    }
  }

  function deepEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== 'object' && typeof b !== 'object') return a === b;
    if (Array.isArray(a) !== Array.isArray(b)) return false;

    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!deepEqual(a[i], b[i])) return false;
      }
      return true;
    }

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
  }

  function createMatcher(actual, isNegated = false) {
    const match = (condition, errorMsg) => {
      const pass = isNegated ? !condition : condition;
      if (!pass) {
        throw new TestAssertionError(errorMsg);
      }
    };

    const matcher = {
      toBe(expected) {
        match(
          actual === expected,
          `Expected ${JSON.stringify(actual)} ${isNegated ? 'NOT to be' : 'to be'} ${JSON.stringify(expected)}`
        );
      },
      toEqual(expected) {
        match(
          deepEqual(actual, expected),
          `Expected ${JSON.stringify(actual)} ${isNegated ? 'NOT to deeply equal' : 'to deeply equal'} ${JSON.stringify(expected)}`
        );
      },
      toBeDefined() {
        match(
          typeof actual !== 'undefined',
          `Expected value ${isNegated ? 'to be undefined' : 'to be defined'}, but got undefined`
        );
      },
      toBeNull() {
        match(
          actual === null,
          `Expected ${JSON.stringify(actual)} ${isNegated ? 'NOT to be null' : 'to be null'}`
        );
      },
      toBeTruthy() {
        match(
          Boolean(actual),
          `Expected ${JSON.stringify(actual)} ${isNegated ? 'NOT to be truthy' : 'to be truthy'}`
        );
      },
      toBeFalsy() {
        match(
          !Boolean(actual),
          `Expected ${JSON.stringify(actual)} ${isNegated ? 'NOT to be falsy' : 'to be falsy'}`
        );
      },
      toBeGreaterThan(expected) {
        match(
          actual > expected,
          `Expected ${actual} ${isNegated ? 'not to be >' : 'to be >'} ${expected}`
        );
      },
      toBeLessThan(expected) {
        match(
          actual < expected,
          `Expected ${actual} ${isNegated ? 'not to be <' : 'to be <'} ${expected}`
        );
      },
      toBeCloseTo(expected, delta = 0.01) {
        const diff = Math.abs(actual - expected);
        match(
          diff <= delta,
          `Expected ${actual} to be close to ${expected} (within ${delta}), actual diff was ${diff}`
        );
      },
      toContain(expected) {
        if (typeof actual === 'string') {
          match(
            actual.includes(expected),
            `Expected "${actual}" ${isNegated ? 'NOT to contain' : 'to contain'} "${expected}"`
          );
        } else if (Array.isArray(actual)) {
          match(
            actual.some(item => deepEqual(item, expected)),
            `Expected array ${isNegated ? 'NOT to contain' : 'to contain'} ${JSON.stringify(expected)}`
          );
        } else {
          throw new TestAssertionError(`Cannot use toContain on type ${typeof actual}`);
        }
      },
      toThrow() {
        let threw = false;
        let thrownError = null;
        if (typeof actual !== 'function') {
          throw new TestAssertionError('toThrow expects actual to be a function');
        }
        try {
          actual();
        } catch (e) {
          threw = true;
          thrownError = e;
        }
        match(
          threw,
          isNegated ? 'Expected function NOT to throw an error' : 'Expected function to throw an error'
        );
      }
    };

    if (!isNegated) {
      matcher.not = createMatcher(actual, true);
    }

    return matcher;
  }

  class HarnessEngine {
    constructor() {
      this.suites = [];
      this.currentSuite = null;
      this.listeners = {
        testStart: [],
        testComplete: [],
        suiteStart: [],
        suiteComplete: [],
        runComplete: []
      };
      this.isRunning = false;
    }

    on(event, fn) {
      if (this.listeners[event]) {
        this.listeners[event].push(fn);
      }
    }

    emit(event, data) {
      if (this.listeners[event]) {
        this.listeners[event].forEach(fn => fn(data));
      }
    }

    describe(name, fn) {
      const suite = {
        name,
        tests: [],
        beforeEachHooks: [],
        afterEachHooks: [],
        status: 'idle',
        passedCount: 0,
        failedCount: 0,
        duration: 0
      };
      this.suites.push(suite);

      const prevSuite = this.currentSuite;
      this.currentSuite = suite;

      try {
        fn();
      } finally {
        this.currentSuite = prevSuite;
      }
    }

    beforeEach(fn) {
      if (this.currentSuite) {
        this.currentSuite.beforeEachHooks.push(fn);
      }
    }

    afterEach(fn) {
      if (this.currentSuite) {
        this.currentSuite.afterEachHooks.push(fn);
      }
    }

    it(name, fn) {
      if (!this.currentSuite) {
        throw new Error('it() must be called inside a describe() block');
      }
      this.currentSuite.tests.push({
        name,
        fn,
        status: 'idle',
        error: null,
        duration: 0
      });
    }

    expect(actual) {
      return createMatcher(actual);
    }

    async runSuite(suite) {
      suite.status = 'running';
      suite.passedCount = 0;
      suite.failedCount = 0;
      const suiteStart = performance.now();
      this.emit('suiteStart', suite);

      for (const test of suite.tests) {
        test.status = 'running';
        this.emit('testStart', { suite, test });
        const start = performance.now();

        try {
          // Run beforeEach hooks
          for (const hook of suite.beforeEachHooks) {
            await hook();
          }

          // Run test
          await test.fn();

          // Run afterEach hooks
          for (const hook of suite.afterEachHooks) {
            await hook();
          }

          test.status = 'pass';
          test.error = null;
          suite.passedCount++;
        } catch (err) {
          test.status = 'fail';
          test.error = err.message || String(err);
          suite.failedCount++;
        } finally {
          test.duration = performance.now() - start;
          this.emit('testComplete', { suite, test });
        }
      }

      suite.duration = performance.now() - suiteStart;
      suite.status = suite.failedCount === 0 ? 'pass' : 'fail';
      this.emit('suiteComplete', suite);
    }

    async runAll() {
      if (this.isRunning) return;
      this.isRunning = true;

      const runStart = performance.now();
      for (const suite of this.suites) {
        await this.runSuite(suite);
      }

      const totalDuration = performance.now() - runStart;
      this.isRunning = false;

      const summary = this.getStats();
      summary.totalDuration = totalDuration;
      this.emit('runComplete', summary);
      return summary;
    }

    getStats() {
      let totalTests = 0;
      let totalPassed = 0;
      let totalFailed = 0;

      for (const suite of this.suites) {
        totalTests += suite.tests.length;
        totalPassed += suite.passedCount;
        totalFailed += suite.failedCount;
      }

      return {
        suitesCount: this.suites.length,
        totalTests,
        totalPassed,
        totalFailed,
        passRate: totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 100
      };
    }

    generateMarkdownReport() {
      const stats = this.getStats();
      let md = `# Shangrilla Gardens & BBQ — Test Harness Report\n\n`;
      md += `**Date:** ${new Date().toLocaleString()}\n`;
      md += `**Overall Status:** ${stats.totalFailed === 0 ? '✅ PASSED' : '❌ FAILED'}\n`;
      md += `**Score:** ${stats.totalPassed}/${stats.totalTests} passed (${stats.passRate}%)\n\n`;
      md += `| Test Suite | Total | Passed | Failed | Status |\n`;
      md += `| :--- | :---: | :---: | :---: | :---: |\n`;

      for (const suite of this.suites) {
        const icon = suite.status === 'pass' ? '✅' : '❌';
        md += `| ${suite.name} | ${suite.tests.length} | ${suite.passedCount} | ${suite.failedCount} | ${icon} |\n`;
      }

      md += `\n### Detailed Breakdown\n`;
      for (const suite of this.suites) {
        md += `\n#### ${suite.name}\n`;
        for (const t of suite.tests) {
          const sym = t.status === 'pass' ? '✔' : '✖';
          md += `- ${sym} **${t.name}** (${t.duration.toFixed(1)}ms)\n`;
          if (t.error) {
            md += `  > Error: \`${t.error}\`\n`;
          }
        }
      }
      return md;
    }
  }

  // Export globally
  const engine = new HarnessEngine();
  window.harnessEngine = engine;
  window.describe = engine.describe.bind(engine);
  window.it = engine.it.bind(engine);
  window.expect = engine.expect.bind(engine);
  window.beforeEach = engine.beforeEach.bind(engine);
  window.afterEach = engine.afterEach.bind(engine);

})(window);
