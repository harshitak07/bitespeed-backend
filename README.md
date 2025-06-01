# Bitespeed Backend Assignment

This is a Node.js + MySQL implementation of the `/identify` endpoint for the Bitespeed backend assignment.

## Endpoint

- `POST /identify`
- Accepts JSON body with `email` and/or `phoneNumber`

### Sample Request

```json
{
  "email": "example@email.com",
  "phoneNumber": "123456"
}
