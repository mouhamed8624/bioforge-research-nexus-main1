# Resend Domain Setup Guide

## Pour envoyer des emails à n'importe quel destinataire

### 🎯 Objectif
Actuellement, Resend (version gratuite) ne permet d'envoyer des emails qu'à votre adresse vérifiée (`mohamed8624.dev@gmail.com`). Pour envoyer à d'autres destinataires, vous devez vérifier un domaine.

### 📋 Étapes pour vérifier un domaine

#### 1. Accéder à Resend Dashboard
- Allez sur [resend.com](https://resend.com)
- Connectez-vous à votre compte
- Allez dans "Domains" dans le menu

#### 2. Ajouter un domaine
- Cliquez sur "Add Domain"
- Entrez votre domaine (ex: `cigass.com` ou `votre-domaine.com`)
- Cliquez sur "Add Domain"

#### 3. Configurer les enregistrements DNS
Resend vous donnera des enregistrements DNS à ajouter à votre domaine :

**Exemple d'enregistrements :**
```
Type: TXT
Name: @
Value: resend-verification=abc123...

Type: CNAME
Name: email
Value: track.resend.com
```

#### 4. Attendre la vérification
- La vérification peut prendre jusqu'à 24h
- Vous recevrez un email de confirmation

#### 5. Mettre à jour le code
Une fois le domaine vérifié, mettez à jour le serveur email :

```javascript
// Dans server/emailServer.js, changez :
from: 'CIGASS <onboarding@resend.dev>'

// Par :
from: 'CIGASS <noreply@votre-domaine.com>'
```

### 🚀 Alternative : Utiliser un sous-domaine

Si vous n'avez pas de domaine principal, vous pouvez utiliser un service comme :
- **Cloudflare Pages** (gratuit)
- **Vercel** (gratuit)
- **Netlify** (gratuit)

### 📧 Test après configuration

Une fois configuré, vous pourrez :
- Envoyer des emails à n'importe quel destinataire
- Utiliser votre propre domaine comme expéditeur
- Avoir une meilleure délivrabilité

### 🔧 Mise à jour du code

Après vérification du domaine, mettez à jour :

1. **server/emailServer.js** :
```javascript
from: 'CIGASS <noreply@votre-domaine.com>'
```

2. **src/services/email/simpleEmailService.ts** :
```javascript
// Mettre à jour l'email d'expéditeur dans les templates
```

### 📞 Support

Si vous avez besoin d'aide pour configurer un domaine, contactez votre fournisseur de domaine ou utilisez un service comme Cloudflare qui offre un DNS gratuit. 