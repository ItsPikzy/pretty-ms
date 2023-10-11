'use strict';
const parseMilliseconds = require('parse-ms');

const language = {
  EN: {
    years: {
      short: 'y',
      long: 'year'
    },
    days: {
      short: 'd',
      long: 'day'
    },
    hours: {
      short: 'j',
      long: 'jam'
    },
    minutes: {
      short: 'm',
      long: 'menit'
    },
    seconds: {
      short: 'd',
      long: 'detik'
    },
    milliseconds: {
      short: 'ms',
      long: 'millisecond'
    },
    microseconds: {
      short: 'µs',
      long: 'microsecond'
    },
    nanoseconds: {
      short: 'ns',
      long: 'nanosecond'
    }
  },
  ID: {
    years: {
      short: 't',
      long: 'tahun'
    },
    days: {
      short: 'h',
      long: 'hari'
    },
    hours: {
      short: 'j',
      long: 'jam'
    },
    minutes: {
      short: 'm',
      long: 'menit'
    },
    seconds: {
      short: 'd',
      long: 'detik'
    },
    milliseconds: {
      short: 'md',
      long: 'milidetik'
    },
    microseconds: {
      short: 'μdtk',
      long: 'mikrodetik'
    },
    nanoseconds: {
      short: 'nd',
      long: 'nanodetik'
    }
  }
}

const lang = (langu) => language[langu] ?? language['EN'];

module.exports = (milliseconds, options = {}) => {
	if (!Number.isFinite(milliseconds)) {
		throw new TypeError('Expected a finite number');
	}

  const langu = lang(options.language);

	if (options.colonNotation) {
		options.compact = false;
		options.formatSubMilliseconds = false;
		options.separateMilliseconds = false;
		options.verbose = false;
	}

	if (options.compact) {
		options.secondsDecimalDigits = 0;
		options.millisecondsDecimalDigits = 0;
	}

	const result = [];
	const add = (value, name, valueString) => {
		if ((result.length === 0 || !options.colonNotation) && value === 0 && !(options.colonNotation && name.short === langu.minutes.short)) {
			return;
		}

		valueString = (valueString || value || '0').toString();
		let prefix;
		let suffix;
		if (options.colonNotation) {
			prefix = result.length > 0 ? ':' : '';
			suffix = '';
			const wholeDigits = valueString.includes('.') ? valueString.split('.')[0].length : valueString.length;
			const minLength = result.length > 0 ? 2 : 1;
			valueString = '0'.repeat(Math.max(0, minLength - wholeDigits)) + valueString;
		} else {
			prefix = '';
			suffix = options.verbose ? ' ' + (value === 1 ? word : word + (options.language == 'EN' ? 's' : '')) : name.short;
		}

		result.push(prefix + valueString + suffix);
	};

	const secondsDecimalDigits =
		typeof options.secondsDecimalDigits === 'number' ?
			options.secondsDecimalDigits :
			1;

	if (secondsDecimalDigits < 1) {
		const difference = 1000 - (milliseconds % 1000);
		if (difference < 500) {
			milliseconds += difference;
		}
	}

	const parsed = parseMilliseconds(milliseconds);

	add(Math.trunc(parsed.days / 365), langu.year); // tahun
	add(parsed.days % 365, langu.days); // hari
	add(parsed.hours, langu.hours); // jam
	add(parsed.minutes, langu.minutes); // menit

	if (
		options.separateMilliseconds ||
		options.formatSubMilliseconds ||
		milliseconds < 1000
	) {
		add(parsed.seconds, langu.seconds);
		if (options.formatSubMilliseconds) {
			add(parsed.milliseconds, langu.milliseconds); // mili detik
			add(parsed.microseconds, langu.microseconds); // mikro detik
			add(parsed.nanoseconds, langu.nanoseconds); // nano detik
		} else {
			const millisecondsAndBelow =
				parsed.milliseconds +
				(parsed.microseconds / 1000) +
				(parsed.nanoseconds / 1e6);

			const millisecondsDecimalDigits =
				typeof options.millisecondsDecimalDigits === 'number' ?
					options.millisecondsDecimalDigits :
					0;

			const millisecondsString = millisecondsDecimalDigits ?
				millisecondsAndBelow.toFixed(millisecondsDecimalDigits) :
				Math.ceil(millisecondsAndBelow);

			add(
				parseFloat(millisecondsString, 10),
        langu.milliseconds,
				millisecondsString
			);
		}
	} else {
		const seconds = (milliseconds / 1000) % 60;
		const secondsDecimalDigits =
			typeof options.secondsDecimalDigits === 'number' ?
				options.secondsDecimalDigits :
				1;
		const secondsFixed = seconds.toFixed(secondsDecimalDigits);
		const secondsString = options.keepDecimalsOnWholeSeconds ?
			secondsFixed :
			secondsFixed.replace(/\.0+$/, '');
		add(parseFloat(secondsString, 10), langu.seconds, secondsString);
	}

	if (result.length === 0) {
		return '0' + (options.verbose ? ` ${langu.milliseconds.long}` : langu.milliseconds.short);
	}

	if (options.compact) {
		return '~' + result[0];
	}

	if (typeof options.unitCount === 'number') {
		return '~' + result.slice(0, Math.max(options.unitCount, 1)).join(' ');
	}

	return options.colonNotation ? result.join('') : result.join(' ');
}