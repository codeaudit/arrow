import * as fs from 'fs';
import * as path from 'path';
import { Table, readBuffers } from './Arrow';

const arrowFormats = ['file', 'stream'];
const arrowFileNames = ['simple', 'struct', 'dictionary'];
const arrowTestConfigurations = arrowFormats.reduce((configs, format) => {
    return arrowFileNames.reduce((configs, name) => {
        const arrowPath = path.resolve(__dirname, `./arrows/${format}/${name}.arrow`);
        const arrow = fs.readFileSync(arrowPath);
        return [...configs, [format, name, arrow]];
    }, configs);
}, []);

for (let [format, name, arrow] of arrowTestConfigurations) {
    describe(`${format} format`, () => {
        test(`enumerates ${name} batch vectors`, () => {
            expect.hasAssertions();
            for (let vectors of readBuffers(arrow)) {
                for (let vector of vectors) {
                    expect(vector.name).toMatchSnapshot();
                    expect(vector.type).toMatchSnapshot();
                    expect(vector.length).toMatchSnapshot();
                        for (let i = -1, n = vector.length; ++i < n;) {
                        expect(vector.get(i)).toMatchSnapshot();
                    }
                }
            }
        });
        test(`concats ${name} batch vectors into a table`, () => {
            expect.hasAssertions();
            const table = Table.from(arrow);
            for (const vector of table) {
                expect(vector.name).toMatchSnapshot();
                expect(vector.type).toMatchSnapshot();
                expect(vector.length).toMatchSnapshot();
                for (let i = -1, n = vector.length; ++i < n;) {
                    expect(vector.get(i)).toMatchSnapshot();
                }
            }
        });
        test(`batched ${name} and table vectors report the same values`, () => {
            expect.hasAssertions();
            let rowsTotal = 0, table = Table.from(arrow);
            for (let vectors of readBuffers(arrow)) {
                let rowsNow = Math.max(...vectors.map((v) => v.length));
                for (let vi = -1, vn = vectors.length; ++vi < vn;) {
                    let v1 = vectors[vi];
                    let v2 = table.vector(vi);
                    expect(v1.name).toEqual(v2.name);
                    expect(v1.type).toEqual(v2.type);
                    for (let i = -1, n = v1.length; ++i < n;) {
                        expect(v1.get(i)).toEqual(v2.get(i + rowsTotal));
                    }
                }
                rowsTotal += rowsNow;
            }
        });
    });
}
