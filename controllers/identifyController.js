const db = require('../db/connection');

exports.handleIdentify = async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({ message: 'Email or phoneNumber is required' });
    }
    
    const [results] = await db.promise().query(
      `SELECT * FROM Contact WHERE (email = ? OR phoneNumber = ?) AND deletedAt IS NULL`,
      [email, phoneNumber]
    );

    let primaryContact = null;
    let allContacts = [];

    if (results.length === 0) {
      const [insertResult] = await db.promise().query(
        `INSERT INTO Contact (email, phoneNumber, linkPrecedence) VALUES (?, ?, 'primary')`,
        [email, phoneNumber]
      );

      return res.json({
        contact: {
          primaryContatctId: insertResult.insertId,
          emails: [email],
          phoneNumbers: [phoneNumber],
          secondaryContactIds: []
        }
      });
    }

    const contactIds = results.map(r => r.id);
    const linkedIds = results.map(r => r.linkedId).filter(Boolean);

    const allIds = [...new Set([...contactIds, ...linkedIds])];

    const [linkedResults] = await db.promise().query(
      `SELECT * FROM Contact WHERE (id IN (?) OR linkedId IN (?)) AND deletedAt IS NULL`,
      [allIds, allIds]
    );

    allContacts = linkedResults;

    primaryContact = allContacts.reduce((prev, curr) => {
      return new Date(prev.createdAt) < new Date(curr.createdAt) ? prev : curr;
    });

    const primaryId = primaryContact.linkPrecedence === 'primary' ? primaryContact.id : primaryContact.linkedId;

    const alreadyExists = allContacts.some(
      c => c.email === email && c.phoneNumber === phoneNumber
    );

    if (!alreadyExists) {
      await db.promise().query(
        `INSERT INTO Contact (email, phoneNumber, linkPrecedence, linkedId) VALUES (?, ?, 'secondary', ?)`,
        [email, phoneNumber, primaryId]
      );
    }

    const finalContacts = await db.promise().query(
      `SELECT * FROM Contact WHERE id = ? OR linkedId = ?`,
      [primaryId, primaryId]
    );

    const rows = finalContacts[0];

    const emails = [...new Set(rows.map(r => r.email).filter(Boolean))];
    const phones = [...new Set(rows.map(r => r.phoneNumber).filter(Boolean))];
    const secondaryIds = rows
      .filter(r => r.linkPrecedence === 'secondary')
      .map(r => r.id);

    res.json({
      contact: {
        primaryContatctId: primaryId,
        emails,
        phoneNumbers: phones,
        secondaryContactIds: secondaryIds
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
